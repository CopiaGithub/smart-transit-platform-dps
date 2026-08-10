using System.ComponentModel.DataAnnotations;

namespace transit_display_platform_api.Services.AttendanceService;

/// <summary>One child on the roster, with whatever has been recorded for them.</summary>
public class AttendanceStudentModel
{
    public int StudentId { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The child's face, when the school has one on file. Null is the normal
    /// case — the app falls back to the initials of <see cref="Name"/>.
    /// </summary>
    public string? PhotoUrl { get; set; }

    /// <summary>
    /// Null when nobody has marked this child today — which is not the same as
    /// absent, and the app shows it differently.
    /// </summary>
    public bool? IsPresent { get; set; }
}

/// <summary>A class on a date: who is in it and what has been recorded.</summary>
public class AttendanceRosterModel
{
    public DateOnly AttendanceDate { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public int AcademicYearId { get; set; }
    public string? AcademicYearName { get; set; }

    public int TotalStudents { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    /// <summary>On the roster but not yet marked either way.</summary>
    public int UnmarkedCount { get; set; }

    /// <summary>True once any child in this class has a mark for the date.</summary>
    public bool IsMarked { get; set; }
    public DateTime? LastMarkedAt { get; set; }
    public string? LastMarkedBy { get; set; }

    public List<AttendanceStudentModel> Students { get; set; } = new();
}

/// <summary>The classes that actually have students, for the pickers.</summary>
public class ClassListModel
{
    public string Grade { get; set; } = string.Empty;
    public string Division { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class StudentMarkModel
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public bool IsPresent { get; set; }
}

public class SaveAttendanceModel
{
    [Required, MaxLength(20)]
    public string Grade { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string Division { get; set; } = string.Empty;

    /// <summary>Defaults to the school's today. A future date is refused.</summary>
    public DateOnly? AttendanceDate { get; set; }

    public int? AcademicYearId { get; set; }

    [Required, MinLength(1)]
    public List<StudentMarkModel> Marks { get; set; } = new();
}
