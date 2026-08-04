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

    public int? PlatformId { get; set; }

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

    /// <summary>
    /// Optimistic concurrency token. Two gate operators assigning platforms at the
    /// same moment must not both win — the loser gets a DbUpdateConcurrencyException
    /// and retries against a fresh queue instead of duplicating a platform number.
    /// </summary>
    [Timestamp]
    public byte[]? RowVersion { get; set; }

    [ForeignKey(nameof(SessionId))]
    public virtual Sessions? Session { get; set; }

    [ForeignKey(nameof(BusId))]
    public virtual BusesMaster? Bus { get; set; }

    [ForeignKey(nameof(PlatformId))]
    public virtual PlatformsMaster? Platform { get; set; }

    [ForeignKey(nameof(ReplacedByBusId))]
    public virtual BusesMaster? ReplacedByBus { get; set; }

    [ForeignKey(nameof(ReplacesEventId))]
    public virtual BoardingEvents? ReplacesEvent { get; set; }
}
