using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.BusesMasterService;

public class BusesMasterCreateModel
{
    public string BusNumber { get; set; } = string.Empty;
    public string? RegistrationNumber { get; set; }
    public int? RouteId { get; set; }
    public string BusType { get; set; } = BusKind.Active;
    public string? ServiceStatus { get; set; } = BusServiceState.InService;
    public string? OutOfServiceReason { get; set; }
    public int? Capacity { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? DriverLicenceNumber { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class BusesMasterUpdateModel
{
    public string? BusNumber { get; set; }
    public string? RegistrationNumber { get; set; }
    public int? RouteId { get; set; }
    public string? BusType { get; set; }
    public string? ServiceStatus { get; set; }
    public string? OutOfServiceReason { get; set; }
    public int? Capacity { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? DriverLicenceNumber { get; set; }
    public bool? IsActive { get; set; }
}

public class BusesMasterListModel
{
    public int Id { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public string? RegistrationNumber { get; set; }
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
    public string BusType { get; set; } = BusKind.Active;
    public string ServiceStatus { get; set; } = BusServiceState.InService;
    public string? OutOfServiceReason { get; set; }
    public int? Capacity { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? DriverLicenceNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
