using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class BusFleetDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "buses_master",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriverLicenceNumber",
                table: "buses_master",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriverName",
                table: "buses_master",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DriverPhone",
                table: "buses_master",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OutOfServiceReason",
                table: "buses_master",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            // Existing rows come back In Service. The scaffolded default was "", which
            // CK_buses_master_ServiceStatus below would then reject on every row.
            migrationBuilder.AddColumn<string>(
                name: "ServiceStatus",
                table: "buses_master",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "InService");

            // BusType was free text until now, so the column can hold anything the API
            // was handed. Normalise before the constraint goes on, or the ALTER fails
            // on the first stray row: case variants map home, everything else is a
            // service bus, which is what an unrecognised value has always behaved as
            // in BusOperationsService.GetQueueAsync.
            migrationBuilder.Sql(@"
UPDATE buses_master SET BusType = 'Active'  WHERE LOWER(LTRIM(RTRIM(BusType))) = 'active';
UPDATE buses_master SET BusType = 'Reserve' WHERE LOWER(LTRIM(RTRIM(BusType))) = 'reserve';
UPDATE buses_master SET BusType = 'Active'  WHERE BusType NOT IN ('Active','Reserve');");

            migrationBuilder.AddCheckConstraint(
                name: "CK_buses_master_BusType",
                table: "buses_master",
                sql: "[BusType] IN ('Active','Reserve')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_buses_master_Capacity",
                table: "buses_master",
                sql: "[Capacity] IS NULL OR [Capacity] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_buses_master_ServiceStatus",
                table: "buses_master",
                sql: "[ServiceStatus] IN ('InService','Maintenance','Breakdown')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_buses_master_BusType",
                table: "buses_master");

            migrationBuilder.DropCheckConstraint(
                name: "CK_buses_master_Capacity",
                table: "buses_master");

            migrationBuilder.DropCheckConstraint(
                name: "CK_buses_master_ServiceStatus",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "DriverLicenceNumber",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "DriverName",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "DriverPhone",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "OutOfServiceReason",
                table: "buses_master");

            migrationBuilder.DropColumn(
                name: "ServiceStatus",
                table: "buses_master");
        }
    }
}
