using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class BusAllocationAndOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Bus",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Platform",
                table: "boarding_events");

            // Adopt the vocabulary used by the InfoLED proposal and apps/mobile.
            // This has to run after the two indexes above are dropped (their filters
            // name the old values) and before CK_boarding_events_Status is added
            // further down, which would otherwise reject these rows.
            migrationBuilder.Sql(@"
UPDATE boarding_events SET Status = 'Waiting'  WHERE Status = 'Entered';
UPDATE boarding_events SET Status = 'Arrived'  WHERE Status = 'Assigned';
UPDATE boarding_events SET Status = 'Departed' WHERE Status = 'Cleared';");

            migrationBuilder.AddColumn<int>(
                name: "RouteId",
                table: "boarding_events",
                type: "int",
                nullable: true);

            // Backfill the route each past event served, from the bus's own route.
            // Reserve buses have none, so those stay null — which is exactly the gap
            // this column exists to close going forward.
            migrationBuilder.Sql(@"
UPDATE e SET e.RouteId = b.RouteId
FROM boarding_events e
JOIN buses_master b ON b.Id = e.BusId
WHERE e.RouteId IS NULL AND b.RouteId IS NOT NULL;");

            migrationBuilder.CreateTable(
                name: "bus_route_allocation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RouteId = table.Column<int>(type: "int", nullable: false),
                    BusId = table.Column<int>(type: "int", nullable: false),
                    AllocationType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bus_route_allocation", x => x.Id);
                    table.CheckConstraint("CK_bus_route_allocation_Dates", "[EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom]");
                    table.CheckConstraint("CK_bus_route_allocation_Type", "[AllocationType] IN ('Standing','Override')");
                    table.ForeignKey(
                        name: "FK_bus_route_allocation_buses_master_BusId",
                        column: x => x.BusId,
                        principalTable: "buses_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_bus_route_allocation_routes_master_RouteId",
                        column: x => x.RouteId,
                        principalTable: "routes_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_bus_route_allocation_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_bus_route_allocation_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_boarding_events_RouteId",
                table: "boarding_events",
                column: "RouteId");

            migrationBuilder.CreateIndex(
                name: "UX_boarding_events_Session_Bus",
                table: "boarding_events",
                columns: new[] { "SessionId", "BusId" },
                unique: true,
                filter: "[IsDeleted] = 0 AND [Status] <> 'Departed' AND [Status] <> 'Replaced'");

            migrationBuilder.CreateIndex(
                name: "UX_boarding_events_Session_Platform",
                table: "boarding_events",
                columns: new[] { "SessionId", "PlatformId" },
                unique: true,
                filter: "[IsDeleted] = 0 AND [PlatformId] IS NOT NULL AND [Status] IN ('Arrived','Boarding')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_boarding_events_Status",
                table: "boarding_events",
                sql: "[Status] IN ('Waiting','Arrived','Boarding','Departed','Replaced')");

            migrationBuilder.CreateIndex(
                name: "IX_bus_route_allocation_Bus_Dates",
                table: "bus_route_allocation",
                columns: new[] { "BusId", "EffectiveFrom", "EffectiveTo" });

            migrationBuilder.CreateIndex(
                name: "IX_bus_route_allocation_CreatedById",
                table: "bus_route_allocation",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_bus_route_allocation_Route_Dates",
                table: "bus_route_allocation",
                columns: new[] { "RouteId", "EffectiveFrom", "EffectiveTo" });

            migrationBuilder.CreateIndex(
                name: "IX_bus_route_allocation_UpdatedById",
                table: "bus_route_allocation",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_bus_route_allocation_Override_Bus",
                table: "bus_route_allocation",
                columns: new[] { "BusId", "EffectiveFrom" },
                unique: true,
                filter: "[AllocationType] = 'Override' AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_bus_route_allocation_Override_Route",
                table: "bus_route_allocation",
                columns: new[] { "RouteId", "EffectiveFrom" },
                unique: true,
                filter: "[AllocationType] = 'Override' AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_bus_route_allocation_Standing_Bus",
                table: "bus_route_allocation",
                column: "BusId",
                unique: true,
                filter: "[AllocationType] = 'Standing' AND [EffectiveTo] IS NULL AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_bus_route_allocation_Standing_Route",
                table: "bus_route_allocation",
                column: "RouteId",
                unique: true,
                filter: "[AllocationType] = 'Standing' AND [EffectiveTo] IS NULL AND [IsDeleted] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_routes_master_RouteId",
                table: "boarding_events",
                column: "RouteId",
                principalTable: "routes_master",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_routes_master_RouteId",
                table: "boarding_events");

            migrationBuilder.DropTable(
                name: "bus_route_allocation");

            migrationBuilder.DropIndex(
                name: "IX_boarding_events_RouteId",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Bus",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Platform",
                table: "boarding_events");

            migrationBuilder.DropCheckConstraint(
                name: "CK_boarding_events_Status",
                table: "boarding_events");

            migrationBuilder.DropColumn(
                name: "RouteId",
                table: "boarding_events");

            // Restore the old vocabulary before recreating indexes whose filters name it.
            // Replaced has no pre-migration equivalent, so it maps back to Cleared.
            migrationBuilder.Sql(@"
UPDATE boarding_events SET Status = 'Entered'  WHERE Status = 'Waiting';
UPDATE boarding_events SET Status = 'Assigned' WHERE Status = 'Arrived';
UPDATE boarding_events SET Status = 'Cleared'  WHERE Status = 'Replaced';");

            migrationBuilder.CreateIndex(
                name: "UX_boarding_events_Session_Bus",
                table: "boarding_events",
                columns: new[] { "SessionId", "BusId" },
                unique: true,
                filter: "[IsDeleted] = 0 AND [Status] <> 'Cleared'");

            migrationBuilder.CreateIndex(
                name: "UX_boarding_events_Session_Platform",
                table: "boarding_events",
                columns: new[] { "SessionId", "PlatformId" },
                unique: true,
                filter: "[IsDeleted] = 0 AND [PlatformId] IS NOT NULL AND [Status] IN ('Assigned','Boarding')");
        }
    }
}
