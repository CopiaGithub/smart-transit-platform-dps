namespace transit_display_platform_api.Services.PinCodeMasterService;

public class PinCodeMasterListModel
{
    public int Id { get; set; }
    public string PinCode { get; set; } = string.Empty;
    public int? CityId { get; set; }
    public string? CityName { get; set; }
    public bool IsActive { get; set; }
}
