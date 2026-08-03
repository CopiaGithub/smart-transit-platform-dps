namespace transit_display_platform_api.Services.StateMasterService;

public class StateMasterListModel
{
    public int Id { get; set; }
    public string? StateCode { get; set; }
    public string StateName { get; set; } = string.Empty;
    public int? CountryId { get; set; }
    public string? CountryName { get; set; }
    public int? RegionId { get; set; }
    public string? RegionName { get; set; }
    public bool IsActive { get; set; }
}
