using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class MenuMasterAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "menu_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Route = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Icon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    OrderNo = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_master_menu_master_ParentId",
                        column: x => x.ParentId,
                        principalTable: "menu_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "menu_assignment",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MenuId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_assignment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_assignment_menu_master_MenuId",
                        column: x => x.MenuId,
                        principalTable: "menu_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_menu_assignment_rolemaster_RoleId",
                        column: x => x.RoleId,
                        principalTable: "rolemaster",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_menu_assignment_MenuId",
                table: "menu_assignment",
                column: "MenuId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_assignment_RoleId",
                table: "menu_assignment",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_master_ParentId",
                table: "menu_master",
                column: "ParentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "menu_assignment");

            migrationBuilder.DropTable(
                name: "menu_master");
        }
    }
}
