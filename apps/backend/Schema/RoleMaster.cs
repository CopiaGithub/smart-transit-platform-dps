using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("role_master")]
public partial class RoleMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>Gate 6 / Gate 1 / Admin.</summary>
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<UserMaster> Users { get; set; } = new List<UserMaster>();

    public virtual ICollection<MenuAssignment> MenuAssignments { get; set; } = new List<MenuAssignment>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
