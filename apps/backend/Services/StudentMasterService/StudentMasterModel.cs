namespace transit_display_platform_api.Services.StudentMasterService;

public class StudentMasterCreateModel
{
    public string AdmissionNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    /// <summary>Defaults to the current academic year when omitted.</summary>
    public int? AcademicYearId { get; set; }
    public int? ClassTeacherId { get; set; }
    /// <summary>The child rides a route. The bus is the allocation's business.</summary>
    public int? RouteId { get; set; }
    public int? ExitGateId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PickupStop { get; set; }
    public string? DropStop { get; set; }
    public string? RfidTag { get; set; }
    public bool? UsesTransport { get; set; } = true;
    public bool? IsActive { get; set; } = true;
}

public class StudentMasterUpdateModel
{
    public string? AdmissionNumber { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Grade { get; set; }
    public string? Division { get; set; }
    public int? AcademicYearId { get; set; }
    public int? ClassTeacherId { get; set; }
    /// <summary>The child rides a route. The bus is the allocation's business.</summary>
    public int? RouteId { get; set; }
    public int? ExitGateId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PickupStop { get; set; }
    public string? DropStop { get; set; }
    public string? RfidTag { get; set; }
    public bool? UsesTransport { get; set; }
    public bool? IsActive { get; set; }
}

public class StudentMasterListModel
{
    public int Id { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public int AcademicYearId { get; set; }
    public string? AcademicYearName { get; set; }
    public int? ClassTeacherId { get; set; }
    public string? ClassTeacherName { get; set; }
    public int? BusId { get; set; }
    public string? BusNumber { get; set; }
    public int? RouteId { get; set; }
    public string? RouteName { get; set; }
    public int? ExitGateId { get; set; }
    public string? ExitGateName { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PickupStop { get; set; }
    public string? DropStop { get; set; }
    public string? RfidTag { get; set; }
    public bool UsesTransport { get; set; }
    public int ParentCount { get; set; }
    public string? PrimaryContactName { get; set; }
    public string? PrimaryContactMobile { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>A contact as seen from the student side.</summary>
public class StudentParentModel
{
    public int MappingId { get; set; }
    public int ParentId { get; set; }
    public string ParentName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Relation { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool IsEmergencyContact { get; set; }
    public bool IsAuthorisedForPickup { get; set; }
    public bool ReceivesNotifications { get; set; }
    public int ContactPriority { get; set; }
}
