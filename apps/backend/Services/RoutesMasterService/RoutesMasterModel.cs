namespace transit_display_platform_api.Services.RoutesMasterService;

public class RoutesMasterCreateModel
{
    public string? RouteCode { get; set; }
    public string RouteName { get; set; } = string.Empty;
    public string? LedDisplayName { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class RoutesMasterUpdateModel
{
    public string? RouteCode { get; set; }
    public string? RouteName { get; set; }
    public string? LedDisplayName { get; set; }
    public bool? IsActive { get; set; }
}

public class RoutesMasterListModel
{
    public int Id { get; set; }
    public string? RouteCode { get; set; }
    public string RouteName { get; set; } = string.Empty;
    public string? LedDisplayName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
