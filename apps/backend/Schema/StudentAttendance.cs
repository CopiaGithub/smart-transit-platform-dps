using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// One student, one school day, present or not.
///
/// A row exists only once a teacher has marked the class — an unmarked day is
/// the absence of a row, not a row saying "absent". The difference matters: a
/// class nobody marked must not read as a class where everyone was away.
///
/// Who marked it and when are the <see cref="BaseEntity"/> audit columns, so
/// there is no separate MarkedBy here.
/// </summary>
[Table("student_attendance")]
public partial class StudentAttendance : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int StudentId { get; set; }

    /// <summary>
    /// The school's own calendar date, from <c>ISchoolClock</c> — never derived
    /// from <c>DateTime.UtcNow</c>, which files an Indian morning under
    /// yesterday until 05:30.
    /// </summary>
    public DateOnly AttendanceDate { get; set; }

    public bool IsPresent { get; set; } = true;

    [ForeignKey(nameof(StudentId))]
    public virtual StudentMaster? Student { get; set; }
}
