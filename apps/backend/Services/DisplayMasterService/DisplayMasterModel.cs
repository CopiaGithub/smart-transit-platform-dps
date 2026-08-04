namespace transit_display_platform_api.Services.DisplayMasterService;

public class DisplayMasterCreateModel
{
    public string DisplayCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    /// <summary>Outdoor / Indoor.</summary>
    public string DisplayType { get; set; } = "Indoor";
    public int? GateId { get; set; }
    public string? Location { get; set; }
    public string? IpAddress { get; set; }
    public string? ScreenSize { get; set; }
    public int? WidthPx { get; set; }
    public int? HeightPx { get; set; }
    public int? VisibleRowCount { get; set; }
    /// <summary>Null shows every platform; set to scope an indoor panel to one exit.</summary>
    public int? FilterByGateId { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class DisplayMasterUpdateModel
{
    public string? DisplayCode { get; set; }
    public string? DisplayName { get; set; }
    public string? DisplayType { get; set; }
    public int? GateId { get; set; }
    public string? Location { get; set; }
    public string? IpAddress { get; set; }
    public string? ScreenSize { get; set; }
    public int? WidthPx { get; set; }
    public int? HeightPx { get; set; }
    public int? VisibleRowCount { get; set; }
    public int? FilterByGateId { get; set; }
    public bool? IsActive { get; set; }
}

public class DisplayMasterListModel
{
    public int Id { get; set; }
    public string DisplayCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string DisplayType { get; set; } = string.Empty;
    public int? GateId { get; set; }
    public string? GateName { get; set; }
    public string? Location { get; set; }
    public string? IpAddress { get; set; }
    public string? ScreenSize { get; set; }
    public int? WidthPx { get; set; }
    public int? HeightPx { get; set; }
    public int VisibleRowCount { get; set; }
    public int? FilterByGateId { get; set; }
    public string? FilterByGateName { get; set; }
    public DateTime? LastHeartbeatAt { get; set; }
    public string ConnectionStatus { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
