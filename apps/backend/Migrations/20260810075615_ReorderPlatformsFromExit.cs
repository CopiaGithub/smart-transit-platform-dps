using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <summary>
    /// Data only — no schema change.
    ///
    /// SortOrder was seeded equal to PlatformNumber back when nothing read it. It now
    /// decides which platform an arriving bus is given, and the compound fills from the
    /// exit end, so the order has to be reversed: the highest platform number is handed
    /// out first and therefore carries SortOrder 1.
    ///
    /// Written against MAX(PlatformNumber) rather than a literal 23 so a site with a
    /// different number of platforms lands correctly too.
    /// </summary>
    public partial class ReorderPlatformsFromExit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE platforms_master
                SET SortOrder =
                    (SELECT MAX(PlatformNumber) FROM platforms_master WHERE IsDeleted = 0)
                    + 1 - PlatformNumber
                WHERE IsDeleted = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Back to the old "SortOrder mirrors the painted number" arrangement. Any
            // hand-tuning an admin has since done is lost — there is nowhere to put it.
            migrationBuilder.Sql(@"
                UPDATE platforms_master
                SET SortOrder = PlatformNumber
                WHERE IsDeleted = 0;");
        }
    }
}
