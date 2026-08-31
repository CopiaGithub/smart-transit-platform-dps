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

/// <summary>
/// Replace addressed by the failed BUS rather than its boarding event, so a bus
/// that broke down before it ever reached the gate — and therefore has no event —
/// can still be handed to a reserve. When the failed bus is already in the yard
/// this behaves exactly like the event-based replace.
/// </summary>
public class ReplaceByBusModel
{
    public int FailedBusId { get; set; }
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
    public int? Capacity { get; set; }
    public string? DriverName { get; set; }
    /// <summary>So the gate operator can call the driver without leaving the console.</summary>
    public string? DriverPhone { get; set; }
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
}

// ------------------------------------------------------------------ platform status

/// <summary>Every marked platform and whether it is free or held, for the current session.</summary>
public class PlatformStatusModel
{
    public int SessionId { get; set; }
    public int PlatformCount { get; set; }
    public int OccupiedCount { get; set; }
    public int AvailableCount { get; set; }
    public int? NextFreePlatformNumber { get; set; }
    public bool YardFull { get; set; }
    public List<PlatformSlotModel> Platforms { get; set; } = new();
}

/// <summary>One marked platform and who, if anyone, is holding it right now.</summary>
public class PlatformSlotModel
{
    public int PlatformId { get; set; }
    public int PlatformNumber { get; set; }
    public string? PlatformName { get; set; }
    public int? NearestGateId { get; set; }
    public bool IsOccupied { get; set; }

    // Populated only when occupied:
    public int? EventId { get; set; }
    public int? BusId { get; set; }
    public string? BusNumber { get; set; }
    public string? RouteName { get; set; }
    /// <summary>Arrived or Boarding.</summary>
    public string? Status { get; set; }
    public DateTime? AssignedAt { get; set; }
}

// ----------------------------------------------------------------------- bus status

/// <summary>
/// Operational availability of a bus during a dispersal. Distinct from the master-data
/// flags (IsActive, ServiceStatus): it folds in the live boarding event for the session.
/// </summary>
public static class BusAvailability
{
    /// <summary>Active, in-service, not yet entered — offerable at the gate.</summary>
    public const string Available = "Available";
    /// <summary>In the yard with no platform because every platform is occupied.</summary>
    public const string Waiting = "Waiting";
    /// <summary>Holding a platform (Arrived or Boarding).</summary>
    public const string InYard = "InYard";
    public const string Departed = "Departed";
    public const string Replaced = "Replaced";
    /// <summary>On the roster but under Maintenance or Breakdown.</summary>
    public const string OutOfService = "OutOfService";
    /// <summary>Retired from the fleet (IsActive = false).</summary>
    public const string Inactive = "Inactive";
}

public class BusStatusModel
{
    /// <summary>Null when no dispersal session is open — status is master-data only.</summary>
    public int? SessionId { get; set; }
    public int TotalBuses { get; set; }
    public int AvailableCount { get; set; }
    public int InYardCount { get; set; }
    public int OutOfServiceCount { get; set; }
    /// <summary>Allocated for today and fit to run, but not yet recorded in at the gate. Zero when no session is open.</summary>
    public int YetToArriveCount { get; set; }
    public List<BusStatusRowModel> Buses { get; set; } = new();
}

public class BusStatusRowModel
{
    public int BusId { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    /// <summary>Active / Reserve.</summary>
    public string BusType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    /// <summary>InService / Maintenance / Breakdown.</summary>
    public string ServiceStatus { get; set; } = string.Empty;
    public string? OutOfServiceReason { get; set; }
    /// <summary>Operational state for the session. See <see cref="BusAvailability"/>.</summary>
    public string Availability { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public string? DriverName { get; set; }
    /// <summary>So the gate operator can call the driver without leaving the console.</summary>
    public string? DriverPhone { get; set; }
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }

    // Current live event, when the bus is in the session:
    public int? CurrentEventId { get; set; }
    public string? CurrentStatus { get; set; }
    public int? CurrentPlatformNumber { get; set; }
}
