namespace transit_display_platform_api.Schema;

/// <summary>
/// Soft-delete and audit columns shared by every persisted entity.
/// <see cref="CreatedById"/> and <see cref="UpdatedById"/> are mapped to
/// <c>user_master</c> foreign keys in ApplicationDbContext.OnModelCreating.
/// </summary>
public abstract class BaseEntity
{
    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
