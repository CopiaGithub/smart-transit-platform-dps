namespace transit_display_platform_api.Services.BusesMasterService;

public class BusesMasterCreateModel
{
    public string BusNumber { get; set; } = string.Empty;
    public int? RouteId { get; set; }
    public string BusType { get; set; } = "Active";
    public bool? IsActive { get; set; } = true;
}

public class BusesMasterUpdateModel
{
    public string? BusNumber { get; set; }
    public int? RouteId { get; set; }
    public string? BusType { get; set; }
    public bool? IsActive { get; set; }
}

public class BusesMasterListModel
{
    public int Id { get; set; }
    public string BusNumber { get; set; } = string.Empty;
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
    public string BusType { get; set; } = "Active";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
