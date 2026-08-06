using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformSide : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Side",
                table: "platforms_master",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_platforms_master_Side",
                table: "platforms_master",
                sql: "[Side] IS NULL OR [Side] IN ('Left','Right')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_platforms_master_Side",
                table: "platforms_master");

            migrationBuilder.DropColumn(
                name: "Side",
                table: "platforms_master");
        }
    }
}
