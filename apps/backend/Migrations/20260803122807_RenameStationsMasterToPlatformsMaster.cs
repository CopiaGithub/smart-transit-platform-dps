using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class RenameStationsMasterToPlatformsMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_stations_master_StationId",
                table: "boarding_events");

            migrationBuilder.RenameTable(
                name: "stations_master",
                newName: "platforms_master");

            migrationBuilder.RenameColumn(
                name: "StationNumber",
                table: "platforms_master",
                newName: "PlatformNumber");

            migrationBuilder.RenameColumn(
                name: "StationName",
                table: "platforms_master",
                newName: "PlatformName");

            migrationBuilder.RenameColumn(
                name: "StationId",
                table: "boarding_events",
                newName: "PlatformId");

            migrationBuilder.RenameIndex(
                name: "IX_boarding_events_StationId",
                table: "boarding_events",
                newName: "IX_boarding_events_PlatformId");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_platforms_master_PlatformId",
                table: "boarding_events",
                column: "PlatformId",
                principalTable: "platforms_master",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_platforms_master_PlatformId",
                table: "boarding_events");

            migrationBuilder.RenameColumn(
                name: "PlatformId",
                table: "boarding_events",
                newName: "StationId");

            migrationBuilder.RenameIndex(
                name: "IX_boarding_events_PlatformId",
                table: "boarding_events",
                newName: "IX_boarding_events_StationId");

            migrationBuilder.RenameColumn(
                name: "PlatformNumber",
                table: "platforms_master",
                newName: "StationNumber");

            migrationBuilder.RenameColumn(
                name: "PlatformName",
                table: "platforms_master",
                newName: "StationName");

            migrationBuilder.RenameTable(
                name: "platforms_master",
                newName: "stations_master");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_stations_master_StationId",
                table: "boarding_events",
                column: "StationId",
                principalTable: "stations_master",
                principalColumn: "Id");
        }
    }
}
