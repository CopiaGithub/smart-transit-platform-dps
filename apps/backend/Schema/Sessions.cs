using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("sessions")]
public partial class Sessions : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public DateOnly SessionDate { get; set; }

    /// <summary>School shift label, e.g. Afternoon Pickup.</summary>
    [MaxLength(50)]
    public string? ShiftName { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    /// <summary>Open / Closed — closed on end-of-day reset.</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Open";

    public DateTime? ResetAt { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
