namespace transit_display_platform_api.Services.DispersalSessionService;

public class OpenSessionModel
{
    /// <summary>Defaults to today.</summary>
    public DateOnly? SessionDate { get; set; }
    /// <summary>e.g. "Afternoon Pickup". Defaults to that.</summary>
    public string? ShiftName { get; set; }
}

public class DispersalSessionListModel
{
    public int Id { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? ShiftName { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ResetAt { get; set; }
    public int TotalBuses { get; set; }
    public int InYard { get; set; }
    public int Waiting { get; set; }
    public int Departed { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
