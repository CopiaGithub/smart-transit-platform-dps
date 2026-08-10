using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_attendance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    AttendanceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsPresent = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_attendance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_attendance_student_master_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_attendance_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_attendance_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_CreatedById",
                table: "student_attendance",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_student_attendance_UpdatedById",
                table: "student_attendance",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_student_attendance_Student_Date",
                table: "student_attendance",
                columns: new[] { "StudentId", "AttendanceDate" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_attendance");
        }
    }
}
