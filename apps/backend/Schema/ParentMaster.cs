using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// A parent or guardian as a person. The relationship to a child — and anything that
/// varies between siblings — lives on <see cref="StudentParentMapping"/>.
/// </summary>
[Table("parent_master")]
public partial class ParentMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(60)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(60)]
    public string? MiddleName { get; set; }

    [MaxLength(60)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>The de facto identity of a parent, and the dedupe key across siblings.</summary>
    [MaxLength(15)]
    public string MobileNumber { get; set; } = string.Empty;

    [MaxLength(15)]
    public string? AltMobileNumber { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? Occupation { get; set; }

    [MaxLength(200)]
    public string? AddressLine1 { get; set; }

    [MaxLength(200)]
    public string? AddressLine2 { get; set; }

    public int? CityId { get; set; }

    public int? StateId { get; set; }

    public int? PinCodeId { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    /// <summary>Aadhaar / PAN / DL — checked when a guardian collects a child at the gate.</summary>
    [MaxLength(30)]
    public string? IdProofType { get; set; }

    [MaxLength(50)]
    public string? IdProofNumber { get; set; }

    /// <summary>Login account for the parent app; null until they register.</summary>
    public int? UserId { get; set; }

    public bool IsWhatsAppEnabled { get; set; } = true;

    public bool IsSmsEnabled { get; set; } = true;

    /// <summary>False until OTP confirms the number, so undeliverable alerts are visible.</summary>
    public bool IsMobileVerified { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(CityId))]
    public virtual CityMaster? City { get; set; }

    [ForeignKey(nameof(StateId))]
    public virtual StateMaster? State { get; set; }

    [ForeignKey(nameof(PinCodeId))]
    public virtual PinCodeMaster? PinCode { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserMaster? User { get; set; }

    public virtual ICollection<StudentParentMapping> StudentMappings { get; set; } = new List<StudentParentMapping>();
}
