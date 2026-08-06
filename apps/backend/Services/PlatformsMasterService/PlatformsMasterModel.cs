namespace transit_display_platform_api.Services.PlatformsMasterService;

public class PlatformsMasterCreateModel
{
    public int PlatformNumber { get; set; }
    public string? PlatformName { get; set; }
    public int SortOrder { get; set; }
    public string? Side { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class PlatformsMasterUpdateModel
{
    public int? PlatformNumber { get; set; }
    public string? PlatformName { get; set; }
    public int? SortOrder { get; set; }
    public string? Side { get; set; }
    public bool? IsActive { get; set; }
}

public class PlatformsMasterListModel
{
    public int Id { get; set; }
    public int PlatformNumber { get; set; }
    public string? PlatformName { get; set; }
    public int SortOrder { get; set; }
    public string? Side { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
