namespace transit_display_platform_api.Services.StudentParentMappingService;

public class StudentParentMappingCreateModel
{
    public int StudentId { get; set; }
    public int ParentId { get; set; }
    /// <summary>Father / Mother / Guardian / Grandfather / Grandmother / Uncle / Aunt / Sibling / Driver / Other.</summary>
    public string Relation { get; set; } = string.Empty;
    public bool? IsPrimaryContact { get; set; }
    public bool? IsEmergencyContact { get; set; }
    public bool? IsAuthorisedForPickup { get; set; } = true;
    public bool? ReceivesNotifications { get; set; } = true;
    public int? ContactPriority { get; set; }
    public bool? IsActive { get; set; } = true;
}

public class StudentParentMappingUpdateModel
{
    public string? Relation { get; set; }
    public bool? IsPrimaryContact { get; set; }
    public bool? IsEmergencyContact { get; set; }
    public bool? IsAuthorisedForPickup { get; set; }
    public bool? ReceivesNotifications { get; set; }
    public int? ContactPriority { get; set; }
    public bool? IsActive { get; set; }
}

public class StudentParentMappingListModel
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public int ParentId { get; set; }
    public string ParentName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Relation { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool IsEmergencyContact { get; set; }
    public bool IsAuthorisedForPickup { get; set; }
    public bool ReceivesNotifications { get; set; }
    public int ContactPriority { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
