using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class AddedmoreMasters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "country_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CountryCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CountryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_master", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "region_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RegionCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    RegionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CountryId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_region_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_region_master_country_master_CountryId",
                        column: x => x.CountryId,
                        principalTable: "country_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "state_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StateCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    StateName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CountryId = table.Column<int>(type: "int", nullable: true),
                    RegionId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_state_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_state_master_country_master_CountryId",
                        column: x => x.CountryId,
                        principalTable: "country_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_state_master_region_master_RegionId",
                        column: x => x.RegionId,
                        principalTable: "region_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "city_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CityCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StateId = table.Column<int>(type: "int", nullable: true),
                    RegionId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_city_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_city_master_region_master_RegionId",
                        column: x => x.RegionId,
                        principalTable: "region_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_city_master_state_master_StateId",
                        column: x => x.StateId,
                        principalTable: "state_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "pincode_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PinCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CityId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pincode_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pincode_master_city_master_CityId",
                        column: x => x.CityId,
                        principalTable: "city_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_city_master_RegionId",
                table: "city_master",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_city_master_StateId",
                table: "city_master",
                column: "StateId");

            migrationBuilder.CreateIndex(
                name: "IX_pincode_master_CityId",
                table: "pincode_master",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_region_master_CountryId",
                table: "region_master",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_state_master_CountryId",
                table: "state_master",
                column: "CountryId");

            migrationBuilder.CreateIndex(
                name: "IX_state_master_RegionId",
                table: "state_master",
                column: "RegionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pincode_master");

            migrationBuilder.DropTable(
                name: "city_master");

            migrationBuilder.DropTable(
                name: "state_master");

            migrationBuilder.DropTable(
                name: "region_master");

            migrationBuilder.DropTable(
                name: "country_master");
        }
    }
}
