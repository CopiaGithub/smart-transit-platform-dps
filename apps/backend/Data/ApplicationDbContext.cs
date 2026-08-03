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

        base.OnModelCreating(modelBuilder);
    }
}
