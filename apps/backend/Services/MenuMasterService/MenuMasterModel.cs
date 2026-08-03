namespace transit_display_platform_api.Services.MenuMasterService;

public class MenuMasterCreateModel
{
    public string? Name { get; set; }
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public int OrderNo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MenuMasterUpdateModel
{
    public string? Name { get; set; }
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public int OrderNo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MenuMasterBulkUpdateModel
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Route { get; set; }
    public int OrderNo { get; set; }
    public bool IsActive { get; set; }
}

public class MenuMasterListModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public int OrderNo { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ChildCount { get; set; }
}

public class MenuMasterDropdownModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
