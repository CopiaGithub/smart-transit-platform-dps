namespace transit_display_platform_api.Services.GateMasterService;

public class GateMasterCreateModel
{
    public string GateCode { get; set; } = string.Empty;
    public string GateName { get; set; } = string.Empty;
    /// <summary>BusEntry / BusExit / StudentExit.</summary>
    public string GateType { get; set; } = "BusEntry";
    public int SortOrder { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class GateMasterUpdateModel
{
    public string? GateCode { get; set; }
    public string? GateName { get; set; }
    public string? GateType { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class GateMasterListModel
{
    public int Id { get; set; }
    public string GateCode { get; set; } = string.Empty;
    public string GateName { get; set; } = string.Empty;
    public string GateType { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int DisplayCount { get; set; }
    public int PlatformCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
