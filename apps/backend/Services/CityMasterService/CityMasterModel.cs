namespace transit_display_platform_api.Services.CityMasterService;

public class CityMasterListModel
{
    public int Id { get; set; }
    public string? CityCode { get; set; }
    public string CityName { get; set; } = string.Empty;
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public int? RegionId { get; set; }
    public string? RegionName { get; set; }
    public bool IsActive { get; set; }
}
