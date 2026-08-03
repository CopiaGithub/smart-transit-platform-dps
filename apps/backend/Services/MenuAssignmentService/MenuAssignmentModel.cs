namespace transit_display_platform_api.Services.MenuAssignmentService;

public class AssignMenusToRoleModel
{
    public int RoleId { get; set; }
    public List<int> MenuIds { get; set; } = new();
}

public class MenuTreeModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public int OrderNo { get; set; }
    public bool IsActive { get; set; }
    public List<MenuTreeModel> Children { get; set; } = new();
}
