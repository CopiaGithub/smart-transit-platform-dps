namespace transit_display_platform_api.Services.AcademicYearMasterService;

public class AcademicYearMasterCreateModel
{
    public string YearName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool? IsCurrent { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class AcademicYearMasterUpdateModel
{
    public string? YearName { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool? IsCurrent { get; set; }
    public bool? IsActive { get; set; }
}

public class AcademicYearMasterListModel
{
    public int Id { get; set; }
    public string YearName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public int StudentCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
