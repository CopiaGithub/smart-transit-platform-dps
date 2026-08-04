namespace transit_display_platform_api.Services.ParentMasterService;

public class ParentMasterCreateModel
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AltMobileNumber { get; set; }
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public int? CityId { get; set; }
    public int? StateId { get; set; }
    public int? PinCodeId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? IdProofType { get; set; }
    public string? IdProofNumber { get; set; }
    public int? UserId { get; set; }
    public bool? IsWhatsAppEnabled { get; set; } = true;
    public bool? IsSmsEnabled { get; set; } = true;
    public bool? IsActive { get; set; } = true;
}

public class ParentMasterUpdateModel
{
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? MobileNumber { get; set; }
    public string? AltMobileNumber { get; set; }
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public int? CityId { get; set; }
    public int? StateId { get; set; }
    public int? PinCodeId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? IdProofType { get; set; }
    public string? IdProofNumber { get; set; }
    public int? UserId { get; set; }
    public bool? IsWhatsAppEnabled { get; set; }
    public bool? IsSmsEnabled { get; set; }
    public bool? IsMobileVerified { get; set; }
    public bool? IsActive { get; set; }
}

public class ParentMasterListModel
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AltMobileNumber { get; set; }
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public int? CityId { get; set; }
    public string? CityName { get; set; }
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public int? PinCodeId { get; set; }
    public string? PinCode { get; set; }
    public string? PhotoUrl { get; set; }
    public string? IdProofType { get; set; }
    public string? IdProofNumber { get; set; }
    public int? UserId { get; set; }
    public bool IsWhatsAppEnabled { get; set; }
    public bool IsSmsEnabled { get; set; }
    public bool IsMobileVerified { get; set; }
    public int ChildrenCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>A child as seen from the parent side — what the parent app lists.</summary>
public class ParentChildModel
{
    public int StudentId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string Class { get; set; } = string.Empty;
    public string Relation { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool IsAuthorisedForPickup { get; set; }
    public string? BusNumber { get; set; }
    public string? RouteName { get; set; }
    public string? ExitGateName { get; set; }
}
