using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("boarding_events")]
public partial class BoardingEvents : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int SessionId { get; set; }

    public int BusId { get; set; }

    public int? StationId { get; set; }

    /// <summary>Entered → Assigned → Boarding → Departed / Replaced / Cleared.</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Entered";

    public int QueueOrder { get; set; }

    public DateTime EnteredAt { get; set; } = DateTime.UtcNow;

    public DateTime? AssignedAt { get; set; }

    public DateTime? DepartedAt { get; set; }

    /// <summary>Set when a reserve/replacement bus takes over this event.</summary>
    public int? ReplacedByBusId { get; set; }

    public int? ReplacesEventId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(SessionId))]
    public virtual Sessions? Session { get; set; }

    [ForeignKey(nameof(BusId))]
    public virtual BusesMaster? Bus { get; set; }

    [ForeignKey(nameof(StationId))]
    public virtual StationsMaster? Station { get; set; }

    [ForeignKey(nameof(ReplacedByBusId))]
    public virtual BusesMaster? ReplacedByBus { get; set; }

    [ForeignKey(nameof(ReplacesEventId))]
    public virtual BoardingEvents? ReplacesEvent { get; set; }
}
