namespace transit_display_platform_api.Services.BusOperationsService;

public class GateInModel
{
    public int BusId { get; set; }
    /// <summary>Optional. Defaults to the open session.</summary>
    public int? SessionId { get; set; }
    /// <summary>Overrides the allocated route — used when a reserve enters unassigned.</summary>
    public int? RouteId { get; set; }
    public string? Notes { get; set; }
}

public class GateOutModel
{
    /// <summary>Supply either the bus or the event; the bus is what the operator sees.</summary>
    public int? BusId { get; set; }
    public int? EventId { get; set; }
    public string? Notes { get; set; }
}

public class ReplaceBusModel
{
    public int ReserveBusId { get; set; }
    public string? Reason { get; set; }
}

/// <summary>One row of the airport-style board.</summary>
public class BoardRowModel
{
    public int EventId { get; set; }
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
    /// <summary>Uppercase form for the LED panel; falls back to RouteName.</summary>
    public string? LedDisplayName { get; set; }
    public int? PlatformId { get; set; }
    public int? PlatformNumber { get; set; }
    public string? PlatformName { get; set; }
    public string Status { get; set; } = string.Empty;
    public int QueueOrder { get; set; }
    public DateTime EnteredAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? DepartedAt { get; set; }
    public string? ReplacedByBusNumber { get; set; }
}

public class BoardModel
{
    public int SessionId { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? ShiftName { get; set; }
    public string? DisplayCode { get; set; }
    public string? DisplayName { get; set; }
    /// <summary>Set when the panel is scoped to one student exit.</summary>
    public string? FilteredByGateName { get; set; }
    public DateTime GeneratedAt { get; set; }
    public List<BoardRowModel> Rows { get; set; } = new();
}

/// <summary>The gate operator's console: what is in the yard and what can still come in.</summary>
public class OperatorQueueModel
{
    public int SessionId { get; set; }
    public int PlatformCount { get; set; }
    public int OccupiedCount { get; set; }
    public int? NextFreePlatformNumber { get; set; }
    public bool YardFull { get; set; }
    public List<BoardRowModel> Yard { get; set; } = new();
    public List<BoardRowModel> Waiting { get; set; } = new();
    public List<AvailableBusModel> AvailableBuses { get; set; } = new();
    public List<AvailableBusModel> AvailableReserves { get; set; } = new();
    public int? UndoableEventId { get; set; }
}

public class AvailableBusModel
{
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
}
