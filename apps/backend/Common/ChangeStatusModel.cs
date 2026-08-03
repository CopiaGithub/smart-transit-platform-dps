namespace transit_display_platform_api.Common;

public class ChangeStatusModel
{
    public List<int> Ids { get; set; } = new();
    public bool IsActive { get; set; }
}
