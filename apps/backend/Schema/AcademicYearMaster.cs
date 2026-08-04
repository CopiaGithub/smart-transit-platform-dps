using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// School year, e.g. 2026-2027. Exactly one row may be marked
/// <see cref="IsCurrent"/> — enforced by a filtered unique index.
/// </summary>
[Table("academic_year_master")]
public partial class AcademicYearMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(9)]
    public string YearName { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool IsCurrent { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<StudentMaster> Students { get; set; } = new List<StudentMaster>();
}
