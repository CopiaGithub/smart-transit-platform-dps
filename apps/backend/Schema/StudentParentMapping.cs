using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// Many-to-many link between students and parents. Carries its own payload, so it is an
/// explicit entity rather than an implicit join table: one father may be the primary
/// contact for one child and merely an emergency contact for another.
/// </summary>
[Table("student_parent_mapping")]
public partial class StudentParentMapping : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int StudentId { get; set; }

    public int ParentId { get; set; }

    /// <summary>Father / Mother / Guardian / Grandfather / Grandmother / Uncle / Aunt / Sibling / Driver / Other.</summary>
    [MaxLength(30)]
    public string Relation { get; set; } = string.Empty;

    public bool IsPrimaryContact { get; set; }

    public bool IsEmergencyContact { get; set; }

    /// <summary>Distinct from notifications: a parent may be informed but not permitted to collect.</summary>
    public bool IsAuthorisedForPickup { get; set; } = true;

    public bool ReceivesNotifications { get; set; } = true;

    public int ContactPriority { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(StudentId))]
    public virtual StudentMaster? Student { get; set; }

    [ForeignKey(nameof(ParentId))]
    public virtual ParentMaster? Parent { get; set; }
}
