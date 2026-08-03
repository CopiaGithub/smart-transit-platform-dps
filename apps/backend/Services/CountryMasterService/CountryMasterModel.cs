namespace transit_display_platform_api.Services.CountryMasterService;

public class CountryMasterListModel
{
    public int Id { get; set; }
    public string? CountryCode { get; set; }
    public string CountryName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
