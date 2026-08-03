namespace transit_display_platform_api.Services.UserMasterService;

public class UserMasterCreateModel
{
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? EmailId { get; set; }
    public string? Password { get; set; }
    public string? Address { get; set; }
    public string? EmployeeCode { get; set; }
    public int? RoleId { get; set; }
    public bool? IsActive { get; set; } = true;
    public int? CreatedById { get; set; }
}

public class UserMasterUpdateModel
{
    public string? Name { get; set; }
    public string? Contact { get; set; }
    public string? EmailId { get; set; }
    public string? Password { get; set; }
    public string? Address { get; set; }
    public string? EmployeeCode { get; set; }
    public int? RoleId { get; set; }
    public bool? IsActive { get; set; }
    public int? UpdatedById { get; set; }
}

public class UserMasterListModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? EmailId { get; set; }
    public string? Address { get; set; }
    public string? EmployeeCode { get; set; }
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
