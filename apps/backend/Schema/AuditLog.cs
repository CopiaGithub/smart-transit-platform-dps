using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("audit_log")]
public partial class AuditLog : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int? SessionId { get; set; }

    public int? BoardingEventId { get; set; }

    public int? RoleId { get; set; }

    /// <summary>Undo / Replace / ForceClear.</summary>
    [MaxLength(50)]
    public string ActionType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ActorName { get; set; }

    public string? PreviousValue { get; set; }

    public string? NewValue { get; set; }

    [MaxLength(500)]
    public string? Details { get; set; }

    public int? CreatedById { get; set; }

    [ForeignKey(nameof(SessionId))]
    public virtual Sessions? Session { get; set; }

    [ForeignKey(nameof(BoardingEventId))]
    public virtual BoardingEvents? BoardingEvent { get; set; }

    [ForeignKey(nameof(RoleId))]
    public virtual RoleMaster? Role { get; set; }
}
