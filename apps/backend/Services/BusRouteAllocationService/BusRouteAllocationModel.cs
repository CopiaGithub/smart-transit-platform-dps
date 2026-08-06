namespace transit_display_platform_api.Services.BusRouteAllocationService;

public class BusRouteAllocationCreateModel
{
    public int RouteId { get; set; }
    public int BusId { get; set; }
    /// <summary>Standing (ongoing) or Override (one date only).</summary>
    public string AllocationType { get; set; } = "Standing";
    public DateOnly EffectiveFrom { get; set; }
    /// <summary>Null for an open-ended standing row. Ignored for an Override.</summary>
    public DateOnly? EffectiveTo { get; set; }
    public string? Reason { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class BusRouteAllocationUpdateModel
{
    public int? RouteId { get; set; }
    public int? BusId { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public string? Reason { get; set; }
    public bool? IsActive { get; set; }
}

public class BusRouteAllocationListModel
{
    public int Id { get; set; }
    public int RouteId { get; set; }
    public string? RouteName { get; set; }
    public string? RouteCode { get; set; }
    public int BusId { get; set; }
    public string? BusNumber { get; set; }
    public string? BusType { get; set; }
    public string AllocationType { get; set; } = string.Empty;
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public string? Reason { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>One resolved route-to-bus pairing for a given date.</summary>
public class ResolvedAllocationModel
{
    public int RouteId { get; set; }
    public string RouteName { get; set; } = string.Empty;
    public string? LedDisplayName { get; set; }
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;
    /// <summary>Standing or Override — tells the operator this is a substitution.</summary>
    public string AllocationType { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

/// <summary>Records a same-day substitution without disturbing the standing allocation.</summary>
public class SubstituteBusModel
{
    public int RouteId { get; set; }
    public int ReplacementBusId { get; set; }
    public DateOnly? Date { get; set; }
    public string? Reason { get; set; }
}
