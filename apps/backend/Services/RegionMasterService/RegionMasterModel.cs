namespace transit_display_platform_api.Services.RegionMasterService;

public class RegionMasterListModel
{
    public int Id { get; set; }
    public string? RegionCode { get; set; }
    public string RegionName { get; set; } = string.Empty;
    public int? CountryId { get; set; }
    public string? CountryName { get; set; }
    public bool IsActive { get; set; }
}
