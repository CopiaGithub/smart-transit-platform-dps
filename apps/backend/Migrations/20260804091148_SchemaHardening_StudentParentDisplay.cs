using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace transit_display_platform_api.Migrations
{
    /// <inheritdoc />
    public partial class SchemaHardening_StudentParentDisplay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_rolemaster_RoleId",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_sessions_SessionId",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_sessions_SessionId",
                table: "boarding_events");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_assignment_rolemaster_RoleId",
                table: "menu_assignment");

            migrationBuilder.DropForeignKey(
                name: "FK_usermaster_rolemaster_RoleId",
                table: "usermaster");

            migrationBuilder.DropIndex(
                name: "IX_boarding_events_SessionId",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_SessionId",
                table: "audit_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_usermaster",
                table: "usermaster");

            migrationBuilder.DropPrimaryKey(
                name: "PK_sessions",
                table: "sessions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_rolemaster",
                table: "rolemaster");

            migrationBuilder.RenameTable(
                name: "usermaster",
                newName: "user_master");

            migrationBuilder.RenameTable(
                name: "sessions",
                newName: "dispersal_sessions");

            migrationBuilder.RenameTable(
                name: "rolemaster",
                newName: "role_master");

            migrationBuilder.RenameColumn(
                name: "Password",
                table: "user_master",
                newName: "PasswordHash");

            migrationBuilder.RenameIndex(
                name: "IX_usermaster_RoleId",
                table: "user_master",
                newName: "IX_user_master_RoleId");

            migrationBuilder.AddColumn<int>(
                name: "NearestGateId",
                table: "platforms_master",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "boarding_events",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ActorUserId",
                table: "audit_log",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "audit_log",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedById",
                table: "audit_log",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FailedLoginAttempts",
                table: "user_master",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "user_master",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockoutEndsAt",
                table: "user_master",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "user_master",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordUpdatedAt",
                table: "user_master",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_master",
                table: "user_master",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_dispersal_sessions",
                table: "dispersal_sessions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_role_master",
                table: "role_master",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "academic_year_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    YearName = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsCurrent = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_academic_year_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_academic_year_master_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_academic_year_master_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "gate_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GateCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GateName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    GateType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gate_master", x => x.Id);
                    table.CheckConstraint("CK_gate_master_GateType", "[GateType] IN ('BusEntry','BusExit','StudentExit')");
                    table.ForeignKey(
                        name: "FK_gate_master_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_gate_master_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "parent_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    MobileNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    AltMobileNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Occupation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CityId = table.Column<int>(type: "int", nullable: true),
                    StateId = table.Column<int>(type: "int", nullable: true),
                    PinCodeId = table.Column<int>(type: "int", nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IdProofType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    IdProofNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    IsWhatsAppEnabled = table.Column<bool>(type: "bit", nullable: false),
                    IsSmsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    IsMobileVerified = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parent_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_parent_master_city_master_CityId",
                        column: x => x.CityId,
                        principalTable: "city_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_parent_master_pincode_master_PinCodeId",
                        column: x => x.PinCodeId,
                        principalTable: "pincode_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_parent_master_state_master_StateId",
                        column: x => x.StateId,
                        principalTable: "state_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_parent_master_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_parent_master_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_parent_master_user_master_UserId",
                        column: x => x.UserId,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "display_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DisplayCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DisplayType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GateId = table.Column<int>(type: "int", nullable: true),
                    Location = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    ScreenSize = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    WidthPx = table.Column<int>(type: "int", nullable: true),
                    HeightPx = table.Column<int>(type: "int", nullable: true),
                    VisibleRowCount = table.Column<int>(type: "int", nullable: false),
                    FilterByGateId = table.Column<int>(type: "int", nullable: true),
                    LastHeartbeatAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConnectionStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_display_master", x => x.Id);
                    table.CheckConstraint("CK_display_master_DisplayType", "[DisplayType] IN ('Outdoor','Indoor')");
                    table.ForeignKey(
                        name: "FK_display_master_gate_master_FilterByGateId",
                        column: x => x.FilterByGateId,
                        principalTable: "gate_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_display_master_gate_master_GateId",
                        column: x => x.GateId,
                        principalTable: "gate_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_display_master_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_display_master_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "student_master",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdmissionNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    LastName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Grade = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Division = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    AcademicYearId = table.Column<int>(type: "int", nullable: false),
                    ClassTeacherId = table.Column<int>(type: "int", nullable: true),
                    BusId = table.Column<int>(type: "int", nullable: true),
                    RouteId = table.Column<int>(type: "int", nullable: true),
                    ExitGateId = table.Column<int>(type: "int", nullable: true),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PickupStop = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DropStop = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    RfidTag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UsesTransport = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_master", x => x.Id);
                    table.ForeignKey(
                        name: "FK_student_master_academic_year_master_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "academic_year_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_buses_master_BusId",
                        column: x => x.BusId,
                        principalTable: "buses_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_gate_master_ExitGateId",
                        column: x => x.ExitGateId,
                        principalTable: "gate_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_routes_master_RouteId",
                        column: x => x.RouteId,
                        principalTable: "routes_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_user_master_ClassTeacherId",
                        column: x => x.ClassTeacherId,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_master_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "student_parent_mapping",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: false),
                    Relation = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsPrimaryContact = table.Column<bool>(type: "bit", nullable: false),
                    IsEmergencyContact = table.Column<bool>(type: "bit", nullable: false),
                    IsAuthorisedForPickup = table.Column<bool>(type: "bit", nullable: false),
                    ReceivesNotifications = table.Column<bool>(type: "bit", nullable: false),
                    ContactPriority = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true),
                    UpdatedById = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_parent_mapping", x => x.Id);
                    table.CheckConstraint("CK_student_parent_mapping_Relation", "[Relation] IN ('Father','Mother','Guardian','Grandfather','Grandmother','Uncle','Aunt','Sibling','Driver','Other')");
                    table.ForeignKey(
                        name: "FK_student_parent_mapping_parent_master_ParentId",
                        column: x => x.ParentId,
                        principalTable: "parent_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_parent_mapping_student_master_StudentId",
                        column: x => x.StudentId,
                        principalTable: "student_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_parent_mapping_user_master_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_student_parent_mapping_user_master_UpdatedById",
                        column: x => x.UpdatedById,
                        principalTable: "user_master",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "academic_year_master",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "EndDate", "IsActive", "IsCurrent", "IsDeleted", "StartDate", "UpdatedAt", "UpdatedById", "YearName" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateOnly(2027, 4, 30), true, true, false, new DateOnly(2026, 6, 1), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "2026-2027" });

            migrationBuilder.InsertData(
                table: "gate_master",
                columns: new[] { "Id", "CreatedAt", "CreatedById", "GateCode", "GateName", "GateType", "IsActive", "IsDeleted", "SortOrder", "UpdatedAt", "UpdatedById" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "G6", "Gate No. 6 (Bus Entry)", "BusEntry", true, false, 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "G1", "Gate No. 1 (Bus Exit)", "BusExit", true, false, 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EXIT1", "School Building Exit 1", "StudentExit", true, false, 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "EXIT2", "School Building Exit 2", "StudentExit", true, false, 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.InsertData(
                table: "display_master",
                columns: new[] { "Id", "ConnectionStatus", "CreatedAt", "CreatedById", "DisplayCode", "DisplayName", "DisplayType", "FilterByGateId", "GateId", "HeightPx", "IpAddress", "IsActive", "IsDeleted", "LastHeartbeatAt", "Location", "ScreenSize", "UpdatedAt", "UpdatedById", "VisibleRowCount", "WidthPx" },
                values: new object[,]
                {
                    { 1, "Unknown", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "OUT-G6", "Outdoor Video Wall - Gate No. 6", "Outdoor", null, 1, null, null, true, false, null, "Gate No. 6 entrance", "8x8", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 25, null },
                    { 2, "Unknown", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "IND-E1", "Indoor Video Wall - Exit 1", "Indoor", 3, 3, null, null, true, false, null, "School building exit 1", "4x6", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 12, null },
                    { 3, "Unknown", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "IND-E2", "Indoor Video Wall - Exit 2", "Indoor", 4, 4, null, null, true, false, null, "School building exit 2", "4x6", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 12, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_state_master_CreatedById",
                table: "state_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_state_master_UpdatedById",
                table: "state_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_routes_master_CreatedById",
                table: "routes_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_routes_master_UpdatedById",
                table: "routes_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_routes_master_RouteCode",
                table: "routes_master",
                column: "RouteCode",
                unique: true,
                filter: "[IsDeleted] = 0 AND [RouteCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_region_master_CreatedById",
                table: "region_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_region_master_UpdatedById",
                table: "region_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_platforms_master_CreatedById",
                table: "platforms_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_platforms_master_NearestGateId",
                table: "platforms_master",
                column: "NearestGateId");

            migrationBuilder.CreateIndex(
                name: "IX_platforms_master_UpdatedById",
                table: "platforms_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_platforms_master_PlatformNumber",
                table: "platforms_master",
                column: "PlatformNumber",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_pincode_master_CreatedById",
                table: "pincode_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_pincode_master_UpdatedById",
                table: "pincode_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_menu_master_CreatedById",
                table: "menu_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_menu_master_UpdatedById",
                table: "menu_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_menu_assignment_CreatedById",
                table: "menu_assignment",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_menu_assignment_UpdatedById",
                table: "menu_assignment",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_country_master_CreatedById",
                table: "country_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_country_master_UpdatedById",
                table: "country_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_city_master_CreatedById",
                table: "city_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_city_master_UpdatedById",
                table: "city_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_buses_master_CreatedById",
                table: "buses_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_buses_master_UpdatedById",
                table: "buses_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_buses_master_BusNumber",
                table: "buses_master",
                column: "BusNumber",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_boarding_events_CreatedById",
                table: "boarding_events",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_boarding_events_Session_Status_Queue",
                table: "boarding_events",
                columns: new[] { "SessionId", "Status", "QueueOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_boarding_events_UpdatedById",
                table: "boarding_events",
                column: "UpdatedById");

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

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_ActorUserId",
                table: "audit_log",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_CreatedById",
                table: "audit_log",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_Session_CreatedAt",
                table: "audit_log",
                columns: new[] { "SessionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_UpdatedById",
                table: "audit_log",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_user_master_CreatedById",
                table: "user_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_user_master_UpdatedById",
                table: "user_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_user_master_EmailId",
                table: "user_master",
                column: "EmailId",
                unique: true,
                filter: "[IsDeleted] = 0 AND [EmailId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_user_master_EmployeeCode",
                table: "user_master",
                column: "EmployeeCode",
                unique: true,
                filter: "[IsDeleted] = 0 AND [EmployeeCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_dispersal_sessions_CreatedById",
                table: "dispersal_sessions",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_dispersal_sessions_Date_Status",
                table: "dispersal_sessions",
                columns: new[] { "SessionDate", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_dispersal_sessions_UpdatedById",
                table: "dispersal_sessions",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_dispersal_sessions_Date_Shift",
                table: "dispersal_sessions",
                columns: new[] { "SessionDate", "ShiftName" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_role_master_CreatedById",
                table: "role_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_role_master_UpdatedById",
                table: "role_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_academic_year_master_CreatedById",
                table: "academic_year_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_academic_year_master_UpdatedById",
                table: "academic_year_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_academic_year_master_IsCurrent",
                table: "academic_year_master",
                column: "IsCurrent",
                unique: true,
                filter: "[IsCurrent] = 1 AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_academic_year_master_YearName",
                table: "academic_year_master",
                column: "YearName",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_display_master_CreatedById",
                table: "display_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_display_master_FilterByGateId",
                table: "display_master",
                column: "FilterByGateId");

            migrationBuilder.CreateIndex(
                name: "IX_display_master_GateId",
                table: "display_master",
                column: "GateId");

            migrationBuilder.CreateIndex(
                name: "IX_display_master_UpdatedById",
                table: "display_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_display_master_DisplayCode",
                table: "display_master",
                column: "DisplayCode",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_gate_master_CreatedById",
                table: "gate_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_gate_master_UpdatedById",
                table: "gate_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_gate_master_GateCode",
                table: "gate_master",
                column: "GateCode",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_CityId",
                table: "parent_master",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_CreatedById",
                table: "parent_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_PinCodeId",
                table: "parent_master",
                column: "PinCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_StateId",
                table: "parent_master",
                column: "StateId");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_UpdatedById",
                table: "parent_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_parent_master_UserId",
                table: "parent_master",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "UX_parent_master_MobileNumber",
                table: "parent_master",
                column: "MobileNumber",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_BusId",
                table: "student_master",
                column: "BusId");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_Class",
                table: "student_master",
                columns: new[] { "AcademicYearId", "Grade", "Division" });

            migrationBuilder.CreateIndex(
                name: "IX_student_master_ClassTeacherId",
                table: "student_master",
                column: "ClassTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_CreatedById",
                table: "student_master",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_ExitGateId",
                table: "student_master",
                column: "ExitGateId");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_RouteId",
                table: "student_master",
                column: "RouteId");

            migrationBuilder.CreateIndex(
                name: "IX_student_master_UpdatedById",
                table: "student_master",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_student_master_Admission_Year",
                table: "student_master",
                columns: new[] { "AdmissionNumber", "AcademicYearId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_student_master_RfidTag",
                table: "student_master",
                column: "RfidTag",
                unique: true,
                filter: "[IsDeleted] = 0 AND [RfidTag] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_student_parent_mapping_CreatedById",
                table: "student_parent_mapping",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_student_parent_mapping_ParentId",
                table: "student_parent_mapping",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_student_parent_mapping_UpdatedById",
                table: "student_parent_mapping",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "UX_student_parent_mapping_OnePrimary",
                table: "student_parent_mapping",
                column: "StudentId",
                unique: true,
                filter: "[IsPrimaryContact] = 1 AND [IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UX_student_parent_mapping_Student_Parent",
                table: "student_parent_mapping",
                columns: new[] { "StudentId", "ParentId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_dispersal_sessions_SessionId",
                table: "audit_log",
                column: "SessionId",
                principalTable: "dispersal_sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_role_master_RoleId",
                table: "audit_log",
                column: "RoleId",
                principalTable: "role_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_user_master_ActorUserId",
                table: "audit_log",
                column: "ActorUserId",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_user_master_CreatedById",
                table: "audit_log",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_user_master_UpdatedById",
                table: "audit_log",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_dispersal_sessions_SessionId",
                table: "boarding_events",
                column: "SessionId",
                principalTable: "dispersal_sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_user_master_CreatedById",
                table: "boarding_events",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_user_master_UpdatedById",
                table: "boarding_events",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_buses_master_user_master_CreatedById",
                table: "buses_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_buses_master_user_master_UpdatedById",
                table: "buses_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_city_master_user_master_CreatedById",
                table: "city_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_city_master_user_master_UpdatedById",
                table: "city_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_country_master_user_master_CreatedById",
                table: "country_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_country_master_user_master_UpdatedById",
                table: "country_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_dispersal_sessions_user_master_CreatedById",
                table: "dispersal_sessions",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_dispersal_sessions_user_master_UpdatedById",
                table: "dispersal_sessions",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_assignment_role_master_RoleId",
                table: "menu_assignment",
                column: "RoleId",
                principalTable: "role_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_assignment_user_master_CreatedById",
                table: "menu_assignment",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_assignment_user_master_UpdatedById",
                table: "menu_assignment",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_master_user_master_CreatedById",
                table: "menu_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_master_user_master_UpdatedById",
                table: "menu_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_pincode_master_user_master_CreatedById",
                table: "pincode_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_pincode_master_user_master_UpdatedById",
                table: "pincode_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_platforms_master_gate_master_NearestGateId",
                table: "platforms_master",
                column: "NearestGateId",
                principalTable: "gate_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_platforms_master_user_master_CreatedById",
                table: "platforms_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_platforms_master_user_master_UpdatedById",
                table: "platforms_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_region_master_user_master_CreatedById",
                table: "region_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_region_master_user_master_UpdatedById",
                table: "region_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_role_master_user_master_CreatedById",
                table: "role_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_role_master_user_master_UpdatedById",
                table: "role_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_routes_master_user_master_CreatedById",
                table: "routes_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_routes_master_user_master_UpdatedById",
                table: "routes_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_state_master_user_master_CreatedById",
                table: "state_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_state_master_user_master_UpdatedById",
                table: "state_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_user_master_role_master_RoleId",
                table: "user_master",
                column: "RoleId",
                principalTable: "role_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_user_master_user_master_CreatedById",
                table: "user_master",
                column: "CreatedById",
                principalTable: "user_master",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_user_master_user_master_UpdatedById",
                table: "user_master",
                column: "UpdatedById",
                principalTable: "user_master",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_dispersal_sessions_SessionId",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_role_master_RoleId",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_user_master_ActorUserId",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_user_master_CreatedById",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_log_user_master_UpdatedById",
                table: "audit_log");

            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_dispersal_sessions_SessionId",
                table: "boarding_events");

            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_user_master_CreatedById",
                table: "boarding_events");

            migrationBuilder.DropForeignKey(
                name: "FK_boarding_events_user_master_UpdatedById",
                table: "boarding_events");

            migrationBuilder.DropForeignKey(
                name: "FK_buses_master_user_master_CreatedById",
                table: "buses_master");

            migrationBuilder.DropForeignKey(
                name: "FK_buses_master_user_master_UpdatedById",
                table: "buses_master");

            migrationBuilder.DropForeignKey(
                name: "FK_city_master_user_master_CreatedById",
                table: "city_master");

            migrationBuilder.DropForeignKey(
                name: "FK_city_master_user_master_UpdatedById",
                table: "city_master");

            migrationBuilder.DropForeignKey(
                name: "FK_country_master_user_master_CreatedById",
                table: "country_master");

            migrationBuilder.DropForeignKey(
                name: "FK_country_master_user_master_UpdatedById",
                table: "country_master");

            migrationBuilder.DropForeignKey(
                name: "FK_dispersal_sessions_user_master_CreatedById",
                table: "dispersal_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_dispersal_sessions_user_master_UpdatedById",
                table: "dispersal_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_assignment_role_master_RoleId",
                table: "menu_assignment");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_assignment_user_master_CreatedById",
                table: "menu_assignment");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_assignment_user_master_UpdatedById",
                table: "menu_assignment");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_master_user_master_CreatedById",
                table: "menu_master");

            migrationBuilder.DropForeignKey(
                name: "FK_menu_master_user_master_UpdatedById",
                table: "menu_master");

            migrationBuilder.DropForeignKey(
                name: "FK_pincode_master_user_master_CreatedById",
                table: "pincode_master");

            migrationBuilder.DropForeignKey(
                name: "FK_pincode_master_user_master_UpdatedById",
                table: "pincode_master");

            migrationBuilder.DropForeignKey(
                name: "FK_platforms_master_gate_master_NearestGateId",
                table: "platforms_master");

            migrationBuilder.DropForeignKey(
                name: "FK_platforms_master_user_master_CreatedById",
                table: "platforms_master");

            migrationBuilder.DropForeignKey(
                name: "FK_platforms_master_user_master_UpdatedById",
                table: "platforms_master");

            migrationBuilder.DropForeignKey(
                name: "FK_region_master_user_master_CreatedById",
                table: "region_master");

            migrationBuilder.DropForeignKey(
                name: "FK_region_master_user_master_UpdatedById",
                table: "region_master");

            migrationBuilder.DropForeignKey(
                name: "FK_role_master_user_master_CreatedById",
                table: "role_master");

            migrationBuilder.DropForeignKey(
                name: "FK_role_master_user_master_UpdatedById",
                table: "role_master");

            migrationBuilder.DropForeignKey(
                name: "FK_routes_master_user_master_CreatedById",
                table: "routes_master");

            migrationBuilder.DropForeignKey(
                name: "FK_routes_master_user_master_UpdatedById",
                table: "routes_master");

            migrationBuilder.DropForeignKey(
                name: "FK_state_master_user_master_CreatedById",
                table: "state_master");

            migrationBuilder.DropForeignKey(
                name: "FK_state_master_user_master_UpdatedById",
                table: "state_master");

            migrationBuilder.DropForeignKey(
                name: "FK_user_master_role_master_RoleId",
                table: "user_master");

            migrationBuilder.DropForeignKey(
                name: "FK_user_master_user_master_CreatedById",
                table: "user_master");

            migrationBuilder.DropForeignKey(
                name: "FK_user_master_user_master_UpdatedById",
                table: "user_master");

            migrationBuilder.DropTable(
                name: "display_master");

            migrationBuilder.DropTable(
                name: "student_parent_mapping");

            migrationBuilder.DropTable(
                name: "parent_master");

            migrationBuilder.DropTable(
                name: "student_master");

            migrationBuilder.DropTable(
                name: "academic_year_master");

            migrationBuilder.DropTable(
                name: "gate_master");

            migrationBuilder.DropIndex(
                name: "IX_state_master_CreatedById",
                table: "state_master");

            migrationBuilder.DropIndex(
                name: "IX_state_master_UpdatedById",
                table: "state_master");

            migrationBuilder.DropIndex(
                name: "IX_routes_master_CreatedById",
                table: "routes_master");

            migrationBuilder.DropIndex(
                name: "IX_routes_master_UpdatedById",
                table: "routes_master");

            migrationBuilder.DropIndex(
                name: "UX_routes_master_RouteCode",
                table: "routes_master");

            migrationBuilder.DropIndex(
                name: "IX_region_master_CreatedById",
                table: "region_master");

            migrationBuilder.DropIndex(
                name: "IX_region_master_UpdatedById",
                table: "region_master");

            migrationBuilder.DropIndex(
                name: "IX_platforms_master_CreatedById",
                table: "platforms_master");

            migrationBuilder.DropIndex(
                name: "IX_platforms_master_NearestGateId",
                table: "platforms_master");

            migrationBuilder.DropIndex(
                name: "IX_platforms_master_UpdatedById",
                table: "platforms_master");

            migrationBuilder.DropIndex(
                name: "UX_platforms_master_PlatformNumber",
                table: "platforms_master");

            migrationBuilder.DropIndex(
                name: "IX_pincode_master_CreatedById",
                table: "pincode_master");

            migrationBuilder.DropIndex(
                name: "IX_pincode_master_UpdatedById",
                table: "pincode_master");

            migrationBuilder.DropIndex(
                name: "IX_menu_master_CreatedById",
                table: "menu_master");

            migrationBuilder.DropIndex(
                name: "IX_menu_master_UpdatedById",
                table: "menu_master");

            migrationBuilder.DropIndex(
                name: "IX_menu_assignment_CreatedById",
                table: "menu_assignment");

            migrationBuilder.DropIndex(
                name: "IX_menu_assignment_UpdatedById",
                table: "menu_assignment");

            migrationBuilder.DropIndex(
                name: "IX_country_master_CreatedById",
                table: "country_master");

            migrationBuilder.DropIndex(
                name: "IX_country_master_UpdatedById",
                table: "country_master");

            migrationBuilder.DropIndex(
                name: "IX_city_master_CreatedById",
                table: "city_master");

            migrationBuilder.DropIndex(
                name: "IX_city_master_UpdatedById",
                table: "city_master");

            migrationBuilder.DropIndex(
                name: "IX_buses_master_CreatedById",
                table: "buses_master");

            migrationBuilder.DropIndex(
                name: "IX_buses_master_UpdatedById",
                table: "buses_master");

            migrationBuilder.DropIndex(
                name: "UX_buses_master_BusNumber",
                table: "buses_master");

            migrationBuilder.DropIndex(
                name: "IX_boarding_events_CreatedById",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "IX_boarding_events_Session_Status_Queue",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "IX_boarding_events_UpdatedById",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Bus",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "UX_boarding_events_Session_Platform",
                table: "boarding_events");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_ActorUserId",
                table: "audit_log");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_CreatedById",
                table: "audit_log");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_Session_CreatedAt",
                table: "audit_log");

            migrationBuilder.DropIndex(
                name: "IX_audit_log_UpdatedById",
                table: "audit_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_master",
                table: "user_master");

            migrationBuilder.DropIndex(
                name: "IX_user_master_CreatedById",
                table: "user_master");

            migrationBuilder.DropIndex(
                name: "IX_user_master_UpdatedById",
                table: "user_master");

            migrationBuilder.DropIndex(
                name: "UX_user_master_EmailId",
                table: "user_master");

            migrationBuilder.DropIndex(
                name: "UX_user_master_EmployeeCode",
                table: "user_master");

            migrationBuilder.DropPrimaryKey(
                name: "PK_role_master",
                table: "role_master");

            migrationBuilder.DropIndex(
                name: "IX_role_master_CreatedById",
                table: "role_master");

            migrationBuilder.DropIndex(
                name: "IX_role_master_UpdatedById",
                table: "role_master");

            migrationBuilder.DropPrimaryKey(
                name: "PK_dispersal_sessions",
                table: "dispersal_sessions");

            migrationBuilder.DropIndex(
                name: "IX_dispersal_sessions_CreatedById",
                table: "dispersal_sessions");

            migrationBuilder.DropIndex(
                name: "IX_dispersal_sessions_Date_Status",
                table: "dispersal_sessions");

            migrationBuilder.DropIndex(
                name: "IX_dispersal_sessions_UpdatedById",
                table: "dispersal_sessions");

            migrationBuilder.DropIndex(
                name: "UX_dispersal_sessions_Date_Shift",
                table: "dispersal_sessions");

            migrationBuilder.DropColumn(
                name: "NearestGateId",
                table: "platforms_master");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "boarding_events");

            migrationBuilder.DropColumn(
                name: "ActorUserId",
                table: "audit_log");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "audit_log");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "audit_log");

            migrationBuilder.DropColumn(
                name: "FailedLoginAttempts",
                table: "user_master");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "user_master");

            migrationBuilder.DropColumn(
                name: "LockoutEndsAt",
                table: "user_master");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "user_master");

            migrationBuilder.DropColumn(
                name: "PasswordUpdatedAt",
                table: "user_master");

            migrationBuilder.RenameTable(
                name: "user_master",
                newName: "usermaster");

            migrationBuilder.RenameTable(
                name: "role_master",
                newName: "rolemaster");

            migrationBuilder.RenameTable(
                name: "dispersal_sessions",
                newName: "sessions");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "usermaster",
                newName: "Password");

            migrationBuilder.RenameIndex(
                name: "IX_user_master_RoleId",
                table: "usermaster",
                newName: "IX_usermaster_RoleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_usermaster",
                table: "usermaster",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_rolemaster",
                table: "rolemaster",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_sessions",
                table: "sessions",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_boarding_events_SessionId",
                table: "boarding_events",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_SessionId",
                table: "audit_log",
                column: "SessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_rolemaster_RoleId",
                table: "audit_log",
                column: "RoleId",
                principalTable: "rolemaster",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_log_sessions_SessionId",
                table: "audit_log",
                column: "SessionId",
                principalTable: "sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_boarding_events_sessions_SessionId",
                table: "boarding_events",
                column: "SessionId",
                principalTable: "sessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_menu_assignment_rolemaster_RoleId",
                table: "menu_assignment",
                column: "RoleId",
                principalTable: "rolemaster",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_usermaster_rolemaster_RoleId",
                table: "usermaster",
                column: "RoleId",
                principalTable: "rolemaster",
                principalColumn: "Id");
        }
    }
}
