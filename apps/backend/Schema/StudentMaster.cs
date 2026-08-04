using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("student_master")]
public partial class StudentMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(30)]
    public string AdmissionNumber { get; set; } = string.Empty;

    [MaxLength(60)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(60)]
    public string? MiddleName { get; set; }

    [MaxLength(60)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>Not numeric — covers Nursery / Jr KG / Sr KG alongside 1–12.</summary>
    [MaxLength(20)]
    public string Grade { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Division { get; set; } = string.Empty;

    public int AcademicYearId { get; set; }

    public int? ClassTeacherId { get; set; }

    public int? BusId { get; set; }

    /// <summary>
    /// Held alongside <see cref="BusId"/> rather than derived from it: when a reserve
    /// bus substitutes, the bus changes but the child's route does not.
    /// </summary>
    public int? RouteId { get; set; }

    /// <summary>Which student exit this child leaves by, so the right indoor panel shows them.</summary>
    public int? ExitGateId { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    [MaxLength(150)]
    public string? PickupStop { get; set; }

    [MaxLength(150)]
    public string? DropStop { get; set; }

    /// <summary>Reserved for the RFID phase named in the proposal; null until cards are issued.</summary>
    [MaxLength(50)]
    public string? RfidTag { get; set; }

    public bool UsesTransport { get; set; } = true;

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(AcademicYearId))]
    public virtual AcademicYearMaster? AcademicYear { get; set; }

    [ForeignKey(nameof(ClassTeacherId))]
    public virtual UserMaster? ClassTeacher { get; set; }

    [ForeignKey(nameof(BusId))]
    public virtual BusesMaster? Bus { get; set; }

    [ForeignKey(nameof(RouteId))]
    public virtual RoutesMaster? Route { get; set; }

    [ForeignKey(nameof(ExitGateId))]
    public virtual GateMaster? ExitGate { get; set; }

    public virtual ICollection<StudentParentMapping> ParentMappings { get; set; } = new List<StudentParentMapping>();
}
