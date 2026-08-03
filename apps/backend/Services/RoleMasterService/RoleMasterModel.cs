namespace transit_display_platform_api.Services.RoleMasterService;

public class RoleMasterCreateModel
{
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class RoleMasterUpdateModel
{
    public string? RoleName { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}

public class RoleMasterListModel
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
