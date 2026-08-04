using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// The physical LED walls: one outdoor at the bus entry gate and one indoor at each
/// student exit. Drives what each screen renders and whether it is still reachable.
/// </summary>
[Table("display_master")]
public partial class DisplayMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string DisplayCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Outdoor / Indoor.</summary>
    [MaxLength(20)]
    public string DisplayType { get; set; } = "Indoor";

    public int? GateId { get; set; }

    [MaxLength(50)]
    public string? Location { get; set; }

    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>Physical panel size, e.g. 8x8 or 4x6 (feet).</summary>
    [MaxLength(20)]
    public string? ScreenSize { get; set; }

    public int? WidthPx { get; set; }

    public int? HeightPx { get; set; }

    /// <summary>Rows of the airport-style board this panel can show at once.</summary>
    public int VisibleRowCount { get; set; } = 10;

    /// <summary>Null shows every platform; set to scope an indoor panel to one exit.</summary>
    public int? FilterByGateId { get; set; }

    public DateTime? LastHeartbeatAt { get; set; }

    /// <summary>Online / Offline / Unknown — refreshed by the display heartbeat.</summary>
    [MaxLength(20)]
    public string ConnectionStatus { get; set; } = "Unknown";

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(GateId))]
    public virtual GateMaster? Gate { get; set; }

    [ForeignKey(nameof(FilterByGateId))]
    public virtual GateMaster? FilterByGate { get; set; }
}
