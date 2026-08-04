using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Data;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<RoutesMaster> RoutesMasters { get; set; }
    public virtual DbSet<BusesMaster> BusesMasters { get; set; }
    public virtual DbSet<PlatformsMaster> PlatformsMasters { get; set; }
    public virtual DbSet<Sessions> Sessions { get; set; }
    public virtual DbSet<BoardingEvents> BoardingEvents { get; set; }
    public virtual DbSet<RoleMaster> RoleMasters { get; set; }
    public virtual DbSet<UserMaster> UserMasters { get; set; }
    public virtual DbSet<MenuMaster> MenuMasters { get; set; }
    public virtual DbSet<MenuAssignment> MenuAssignments { get; set; }
    public virtual DbSet<AuditLog> AuditLogs { get; set; }
    public virtual DbSet<CountryMaster> CountryMasters { get; set; }
    public virtual DbSet<RegionMaster> RegionMasters { get; set; }
    public virtual DbSet<StateMaster> StateMasters { get; set; }
    public virtual DbSet<CityMaster> CityMasters { get; set; }
    public virtual DbSet<PinCodeMaster> PinCodeMasters { get; set; }
    public virtual DbSet<GateMaster> GateMasters { get; set; }
    public virtual DbSet<DisplayMaster> DisplayMasters { get; set; }
    public virtual DbSet<AcademicYearMaster> AcademicYearMasters { get; set; }
    public virtual DbSet<StudentMaster> StudentMasters { get; set; }
    public virtual DbSet<ParentMaster> ParentMasters { get; set; }
    public virtual DbSet<StudentParentMapping> StudentParentMappings { get; set; }
    public virtual DbSet<BusRouteAllocation> BusRouteAllocations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BusesMaster>(entity =>
        {
            entity.HasOne(e => e.Route)
                .WithMany(r => r.Buses)
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<BoardingEvents>(entity =>
        {
            entity.HasOne(e => e.Session)
                .WithMany(s => s.BoardingEvents)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Bus)
                .WithMany(b => b.BoardingEvents)
                .HasForeignKey(e => e.BusId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Platform)
                .WithMany(s => s.BoardingEvents)
                .HasForeignKey(e => e.PlatformId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ReplacedByBus)
                .WithMany()
                .HasForeignKey(e => e.ReplacedByBusId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ReplacesEvent)
                .WithMany()
                .HasForeignKey(e => e.ReplacesEventId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Route)
                .WithMany()
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_boarding_events_Status",
                $"[Status] IN ({Quoted(BoardingStatus.All)})"));
        });

        modelBuilder.Entity<UserMaster>(entity =>
        {
            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<MenuMaster>(entity =>
        {
            entity.HasOne(e => e.Parent)
                .WithMany(m => m.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<MenuAssignment>(entity =>
        {
            entity.HasOne(e => e.Menu)
                .WithMany(m => m.MenuAssignments)
                .HasForeignKey(e => e.MenuId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.MenuAssignments)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasOne(e => e.Session)
                .WithMany(s => s.AuditLogs)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.BoardingEvent)
                .WithMany()
                .HasForeignKey(e => e.BoardingEventId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.AuditLogs)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<RegionMaster>(entity =>
        {
            entity.HasOne(e => e.Country)
                .WithMany(c => c.Regions)
                .HasForeignKey(e => e.CountryId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<StateMaster>(entity =>
        {
            entity.HasOne(e => e.Country)
                .WithMany(c => c.States)
                .HasForeignKey(e => e.CountryId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Region)
                .WithMany(r => r.States)
                .HasForeignKey(e => e.RegionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<CityMaster>(entity =>
        {
            entity.HasOne(e => e.State)
                .WithMany(s => s.Cities)
                .HasForeignKey(e => e.StateId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Region)
                .WithMany(r => r.Cities)
                .HasForeignKey(e => e.RegionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<PinCodeMaster>(entity =>
        {
            entity.HasOne(e => e.City)
                .WithMany(c => c.PinCodes)
                .HasForeignKey(e => e.CityId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        ConfigureNewMasters(modelBuilder);
        SeedReferenceData(modelBuilder);
        ConfigureAuditForeignKeys(modelBuilder);
        ConfigureUniqueConstraints(modelBuilder);
        ConfigurePerformanceIndexes(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    private static void ConfigureNewMasters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PlatformsMaster>(entity =>
        {
            entity.HasOne(e => e.NearestGate)
                .WithMany(g => g.Platforms)
                .HasForeignKey(e => e.NearestGateId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<DisplayMaster>(entity =>
        {
            entity.HasOne(e => e.Gate)
                .WithMany(g => g.Displays)
                .HasForeignKey(e => e.GateId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.FilterByGate)
                .WithMany()
                .HasForeignKey(e => e.FilterByGateId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_display_master_DisplayType",
                "[DisplayType] IN ('Outdoor','Indoor')"));
        });

        modelBuilder.Entity<GateMaster>(entity =>
        {
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_gate_master_GateType",
                "[GateType] IN ('BusEntry','BusExit','StudentExit')"));
        });

        modelBuilder.Entity<StudentMaster>(entity =>
        {
            entity.HasOne(e => e.AcademicYear)
                .WithMany(a => a.Students)
                .HasForeignKey(e => e.AcademicYearId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ClassTeacher)
                .WithMany()
                .HasForeignKey(e => e.ClassTeacherId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Bus)
                .WithMany()
                .HasForeignKey(e => e.BusId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Route)
                .WithMany()
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ExitGate)
                .WithMany()
                .HasForeignKey(e => e.ExitGateId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ParentMaster>(entity =>
        {
            entity.HasOne(e => e.City).WithMany()
                .HasForeignKey(e => e.CityId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.State).WithMany()
                .HasForeignKey(e => e.StateId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.PinCode).WithMany()
                .HasForeignKey(e => e.PinCodeId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.User).WithMany()
                .HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<StudentParentMapping>(entity =>
        {
            entity.HasOne(e => e.Student)
                .WithMany(s => s.ParentMappings)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Parent)
                .WithMany(p => p.StudentMappings)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.ToTable(t => t.HasCheckConstraint(
                "CK_student_parent_mapping_Relation",
                "[Relation] IN ('Father','Mother','Guardian','Grandfather','Grandmother'," +
                "'Uncle','Aunt','Sibling','Driver','Other')"));
        });

        modelBuilder.Entity<BusRouteAllocation>(entity =>
        {
            entity.HasOne(e => e.Route)
                .WithMany()
                .HasForeignKey(e => e.RouteId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Bus)
                .WithMany()
                .HasForeignKey(e => e.BusId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "CK_bus_route_allocation_Type",
                    $"[AllocationType] IN ({Quoted(AllocationKind.All)})");

                t.HasCheckConstraint(
                    "CK_bus_route_allocation_Dates",
                    "[EffectiveTo] IS NULL OR [EffectiveTo] >= [EffectiveFrom]");
            });
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasOne(e => e.ActorUser)
                .WithMany()
                .HasForeignKey(e => e.ActorUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    /// <summary>
    /// The gates and LED panels described in the DPS brief. Seeded rather than left to
    /// manual entry because display and platform records reference them by id.
    /// Timestamps are fixed so migrations stay deterministic across rebuilds.
    /// </summary>
    private static void SeedReferenceData(ModelBuilder modelBuilder)
    {
        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<GateMaster>().HasData(
            new GateMaster { Id = 1, GateCode = "G6", GateName = "Gate No. 6 (Bus Entry)", GateType = "BusEntry", SortOrder = 1, CreatedAt = seededAt, UpdatedAt = seededAt },
            new GateMaster { Id = 2, GateCode = "G1", GateName = "Gate No. 1 (Bus Exit)", GateType = "BusExit", SortOrder = 2, CreatedAt = seededAt, UpdatedAt = seededAt },
            new GateMaster { Id = 3, GateCode = "EXIT1", GateName = "School Building Exit 1", GateType = "StudentExit", SortOrder = 3, CreatedAt = seededAt, UpdatedAt = seededAt },
            new GateMaster { Id = 4, GateCode = "EXIT2", GateName = "School Building Exit 2", GateType = "StudentExit", SortOrder = 4, CreatedAt = seededAt, UpdatedAt = seededAt });

        modelBuilder.Entity<DisplayMaster>().HasData(
            new DisplayMaster
            {
                Id = 1, DisplayCode = "OUT-G6", DisplayName = "Outdoor Video Wall - Gate No. 6",
                DisplayType = "Outdoor", GateId = 1, Location = "Gate No. 6 entrance",
                ScreenSize = "8x8", VisibleRowCount = 25,
                CreatedAt = seededAt, UpdatedAt = seededAt
            },
            new DisplayMaster
            {
                Id = 2, DisplayCode = "IND-E1", DisplayName = "Indoor Video Wall - Exit 1",
                DisplayType = "Indoor", GateId = 3, FilterByGateId = 3, Location = "School building exit 1",
                ScreenSize = "4x6", VisibleRowCount = 12,
                CreatedAt = seededAt, UpdatedAt = seededAt
            },
            new DisplayMaster
            {
                Id = 3, DisplayCode = "IND-E2", DisplayName = "Indoor Video Wall - Exit 2",
                DisplayType = "Indoor", GateId = 4, FilterByGateId = 4, Location = "School building exit 2",
                ScreenSize = "4x6", VisibleRowCount = 12,
                CreatedAt = seededAt, UpdatedAt = seededAt
            });

        modelBuilder.Entity<AcademicYearMaster>().HasData(
            new AcademicYearMaster
            {
                Id = 1, YearName = "2026-2027",
                StartDate = new DateOnly(2026, 6, 1), EndDate = new DateOnly(2027, 4, 30),
                IsCurrent = true, CreatedAt = seededAt, UpdatedAt = seededAt
            });
    }

    /// <summary>
    /// Points every entity's CreatedById / UpdatedById at user_master. These were plain
    /// ints before, so an audit trail could reference a user id that never existed.
    /// </summary>
    private static void ConfigureAuditForeignKeys(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            var builder = modelBuilder.Entity(entityType.ClrType);

            foreach (var column in new[] { nameof(BaseEntity.CreatedById), nameof(BaseEntity.UpdatedById) })
            {
                builder.HasOne(typeof(UserMaster))
                    .WithMany()
                    .HasForeignKey(column)
                    .HasConstraintName($"FK_{entityType.GetTableName()}_user_master_{column}")
                    .OnDelete(DeleteBehavior.NoAction);
            }
        }
    }

    /// <summary>
    /// Filtered unique indexes — the WHERE clause excludes soft-deleted rows so a
    /// retired record never blocks reuse of its code.
    /// </summary>
    private static void ConfigureUniqueConstraints(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BusesMaster>()
            .HasIndex(e => e.BusNumber)
            .HasDatabaseName("UX_buses_master_BusNumber")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<PlatformsMaster>()
            .HasIndex(e => e.PlatformNumber)
            .HasDatabaseName("UX_platforms_master_PlatformNumber")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<RoutesMaster>()
            .HasIndex(e => e.RouteCode)
            .HasDatabaseName("UX_routes_master_RouteCode")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0 AND [RouteCode] IS NOT NULL");

        modelBuilder.Entity<Sessions>()
            .HasIndex(e => new { e.SessionDate, e.ShiftName })
            .HasDatabaseName("UX_dispersal_sessions_Date_Shift")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // A bus cannot be live twice in one dispersal.
        modelBuilder.Entity<BoardingEvents>()
            .HasIndex(e => new { e.SessionId, e.BusId })
            .HasDatabaseName("UX_boarding_events_Session_Bus")
            .IsUnique()
            .HasFilter($"[IsDeleted] = 0 AND [Status] <> '{BoardingStatus.Departed}' " +
                       $"AND [Status] <> '{BoardingStatus.Replaced}'");

        // Two buses cannot occupy the same platform at the same time — the failure
        // mode that has no physical recovery in a queue with no overtaking.
        modelBuilder.Entity<BoardingEvents>()
            .HasIndex(e => new { e.SessionId, e.PlatformId })
            .HasDatabaseName("UX_boarding_events_Session_Platform")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0 AND [PlatformId] IS NOT NULL AND [Status] IN " +
                       $"('{BoardingStatus.Arrived}','{BoardingStatus.Boarding}')");

        modelBuilder.Entity<UserMaster>()
            .HasIndex(e => e.EmailId)
            .HasDatabaseName("UX_user_master_EmailId")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0 AND [EmailId] IS NOT NULL");

        modelBuilder.Entity<UserMaster>()
            .HasIndex(e => e.EmployeeCode)
            .HasDatabaseName("UX_user_master_EmployeeCode")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0 AND [EmployeeCode] IS NOT NULL");

        modelBuilder.Entity<GateMaster>()
            .HasIndex(e => e.GateCode)
            .HasDatabaseName("UX_gate_master_GateCode")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<DisplayMaster>()
            .HasIndex(e => e.DisplayCode)
            .HasDatabaseName("UX_display_master_DisplayCode")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<AcademicYearMaster>()
            .HasIndex(e => e.YearName)
            .HasDatabaseName("UX_academic_year_master_YearName")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // At most one current academic year.
        modelBuilder.Entity<AcademicYearMaster>()
            .HasIndex(e => e.IsCurrent)
            .HasDatabaseName("UX_academic_year_master_IsCurrent")
            .IsUnique()
            .HasFilter("[IsCurrent] = 1 AND [IsDeleted] = 0");

        modelBuilder.Entity<StudentMaster>()
            .HasIndex(e => new { e.AdmissionNumber, e.AcademicYearId })
            .HasDatabaseName("UX_student_master_Admission_Year")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<StudentMaster>()
            .HasIndex(e => e.RfidTag)
            .HasDatabaseName("UX_student_master_RfidTag")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0 AND [RfidTag] IS NOT NULL");

        modelBuilder.Entity<ParentMaster>()
            .HasIndex(e => e.MobileNumber)
            .HasDatabaseName("UX_parent_master_MobileNumber")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        modelBuilder.Entity<StudentParentMapping>()
            .HasIndex(e => new { e.StudentId, e.ParentId })
            .HasDatabaseName("UX_student_parent_mapping_Student_Parent")
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Exactly one primary contact per student, guaranteed by the database
        // rather than by every code path remembering to check.
        modelBuilder.Entity<StudentParentMapping>()
            .HasIndex(e => e.StudentId)
            .HasDatabaseName("UX_student_parent_mapping_OnePrimary")
            .IsUnique()
            .HasFilter("[IsPrimaryContact] = 1 AND [IsDeleted] = 0");

        // One bus per route and one route per bus, for the open-ended standing
        // arrangement. Closed date ranges cannot be covered by an index — SQL Server
        // has no exclusion constraints — so BusRouteAllocationService also checks
        // for overlaps before inserting.
        var standing = $"[AllocationType] = '{AllocationKind.Standing}' " +
                       "AND [EffectiveTo] IS NULL AND [IsDeleted] = 0";

        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => e.RouteId)
            .HasDatabaseName("UX_bus_route_allocation_Standing_Route")
            .IsUnique()
            .HasFilter(standing);

        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => e.BusId)
            .HasDatabaseName("UX_bus_route_allocation_Standing_Bus")
            .IsUnique()
            .HasFilter(standing);

        // A route, and a bus, can carry at most one override on any given date.
        var over = $"[AllocationType] = '{AllocationKind.Override}' AND [IsDeleted] = 0";

        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => new { e.RouteId, e.EffectiveFrom })
            .HasDatabaseName("UX_bus_route_allocation_Override_Route")
            .IsUnique()
            .HasFilter(over);

        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => new { e.BusId, e.EffectiveFrom })
            .HasDatabaseName("UX_bus_route_allocation_Override_Bus")
            .IsUnique()
            .HasFilter(over);
    }

    /// <summary>Renders a string array as a SQL IN-list: 'A','B','C'.</summary>
    private static string Quoted(IEnumerable<string> values) =>
        string.Join(",", values.Select(v => $"'{v}'"));

    private static void ConfigurePerformanceIndexes(ModelBuilder modelBuilder)
    {
        // Hottest path in the system: the live board re-reads the open session.
        modelBuilder.Entity<BoardingEvents>()
            .HasIndex(e => new { e.SessionId, e.Status, e.QueueOrder })
            .HasDatabaseName("IX_boarding_events_Session_Status_Queue");

        modelBuilder.Entity<Sessions>()
            .HasIndex(e => new { e.SessionDate, e.Status })
            .HasDatabaseName("IX_dispersal_sessions_Date_Status");

        modelBuilder.Entity<AuditLog>()
            .HasIndex(e => new { e.SessionId, e.CreatedAt })
            .HasDatabaseName("IX_audit_log_Session_CreatedAt");

        modelBuilder.Entity<StudentMaster>()
            .HasIndex(e => new { e.AcademicYearId, e.Grade, e.Division })
            .HasDatabaseName("IX_student_master_Class");

        modelBuilder.Entity<StudentMaster>()
            .HasIndex(e => e.BusId)
            .HasDatabaseName("IX_student_master_BusId");

        modelBuilder.Entity<StudentParentMapping>()
            .HasIndex(e => e.ParentId)
            .HasDatabaseName("IX_student_parent_mapping_ParentId");

        modelBuilder.Entity<BoardingEvents>()
            .HasIndex(e => e.RouteId)
            .HasDatabaseName("IX_boarding_events_RouteId");

        // Resolving "which bus runs this route today" on every gate-in.
        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => new { e.RouteId, e.EffectiveFrom, e.EffectiveTo })
            .HasDatabaseName("IX_bus_route_allocation_Route_Dates");

        modelBuilder.Entity<BusRouteAllocation>()
            .HasIndex(e => new { e.BusId, e.EffectiveFrom, e.EffectiveTo })
            .HasDatabaseName("IX_bus_route_allocation_Bus_Dates");
    }
}
