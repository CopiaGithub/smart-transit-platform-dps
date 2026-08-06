using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("buses_master")]
public partial class BusesMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>Short code shown on the LED board — not the RTO plate.</summary>
    [MaxLength(20)]
    public string BusNumber { get; set; } = string.Empty;

    public int? RouteId { get; set; }

    /// <summary>Active daily service or reserve substitute bus. See <see cref="BusKind"/>.</summary>
    [MaxLength(20)]
    public string BusType { get; set; } = BusKind.Active;

    /// <summary>
    /// Whether the vehicle can run today. Distinct from <see cref="IsActive"/>, which
    /// retires a bus from the fleet: a breakdown mid-dispersal has to keep the bus on
    /// the roster while removing it from the gate operator's available list.
    /// See <see cref="BusServiceState"/>.
    /// </summary>
    [MaxLength(20)]
    public string ServiceStatus { get; set; } = BusServiceState.InService;

    /// <summary>Why the bus is not in service. Null whenever ServiceStatus is InService.</summary>
    [MaxLength(200)]
    public string? OutOfServiceReason { get; set; }

    /// <summary>Seated capacity. Null when not yet recorded for an older row.</summary>
    public int? Capacity { get; set; }

    [MaxLength(100)]
    public string? DriverName { get; set; }

    /// <summary>Contact for the gate operator when a bus breaks down mid-dispersal.</summary>
    [MaxLength(20)]
    public string? DriverPhone { get; set; }

    [MaxLength(30)]
    public string? DriverLicenceNumber { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(RouteId))]
    public virtual RoutesMaster? Route { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();
}

/// <summary>
/// Fleet role. Defined once because BusOperationsService splits the operator console
/// on these strings — a free-text typo silently files a reserve under the wrong list.
/// </summary>
public static class BusKind
{
    public const string Active = "Active";
    public const string Reserve = "Reserve";

    public static readonly string[] All = { Active, Reserve };
}

/// <summary>Whether a bus can be sent out today.</summary>
public static class BusServiceState
{
    public const string InService = "InService";
    public const string Maintenance = "Maintenance";
    public const string Breakdown = "Breakdown";

    public static readonly string[] All = { InService, Maintenance, Breakdown };

    /// <summary>States that keep a bus out of the gate operator's available list.</summary>
    public static readonly string[] OutOfService = { Maintenance, Breakdown };
}
