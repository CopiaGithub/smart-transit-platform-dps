using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// Which bus serves which route, and from when. Answers "who runs Vashi tomorrow?"
/// before a dispersal has started.
///
/// A <see cref="AllocationKind.Standing"/> row is the normal arrangement and is
/// open-ended (<see cref="EffectiveTo"/> null) until it is closed off. A
/// <see cref="AllocationKind.Override"/> row covers a single date and beats the
/// standing row for that date — this is how an 11th-hour reserve substitution is
/// recorded without disturbing the permanent allocation.
/// </summary>
[Table("bus_route_allocation")]
public partial class BusRouteAllocation : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int RouteId { get; set; }

    public int BusId { get; set; }

    /// <summary>Standing or Override — see <see cref="AllocationKind"/>.</summary>
    [MaxLength(20)]
    public string AllocationType { get; set; } = AllocationKind.Standing;

    public DateOnly EffectiveFrom { get; set; }

    /// <summary>Null means open-ended. An Override always sets this equal to EffectiveFrom.</summary>
    public DateOnly? EffectiveTo { get; set; }

    /// <summary>Why this allocation exists — "breakdown", "servicing", "route merged".</summary>
    [MaxLength(200)]
    public string? Reason { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(RouteId))]
    public virtual RoutesMaster? Route { get; set; }

    [ForeignKey(nameof(BusId))]
    public virtual BusesMaster? Bus { get; set; }
}

public static class AllocationKind
{
    public const string Standing = "Standing";
    public const string Override = "Override";

    public static readonly string[] All = { Standing, Override };
}
