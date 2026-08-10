using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.AttendanceService;

/// <summary>
/// Class attendance: pick a standard and a division, mark who is missing.
///
/// Two rules shape everything here.
///
/// The date comes from <see cref="ISchoolClock"/>, never from
/// <c>DateTime.UtcNow</c> — an Indian school morning is the previous day in UTC
/// until 05:30, and attendance filed under yesterday is worse than none.
///
/// And a client never decides which children are in a class. The marks it sends
/// are matched against the roster the server reads, and anything else is
/// dropped: a stale screen must not be able to mark a child from another class,
/// or from last year.
/// </summary>
public class AttendanceService : IAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;
    private readonly ISchoolClock _clock;

    public AttendanceService(
        ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility, ISchoolClock clock)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _clock = clock;
    }

    public async Task<ServiceResponseDto<List<ClassListModel>>> GetClassesAsync(int? academicYearId = null)
    {
        int? yearId = await ResolveYearAsync(academicYearId);
        if (yearId == null) return Fail<List<ClassListModel>>("No academic year is set as current.");

        // Standards and divisions are not master tables — they are whatever the
        // student records say, so the pickers are built from the roll itself.
        var classes = await _context.StudentMasters
            .Where(s => !s.IsDeleted && s.IsActive && s.AcademicYearId == yearId)
            .GroupBy(s => new { s.Grade, s.Division })
            .Select(g => new ClassListModel
            {
                Grade = g.Key.Grade,
                Division = g.Key.Division,
                StudentCount = g.Count()
            })
            .ToListAsync();

        return new ServiceResponseDto<List<ClassListModel>>
        {
            Data = classes.OrderBy(c => GradeRank(c.Grade)).ThenBy(c => c.Division).ToList(),
            TotalRecords = classes.Count
        };
    }

    public async Task<ServiceResponseDto<AttendanceRosterModel>> GetRosterAsync(
        string grade, string division, DateOnly? date = null, int? academicYearId = null)
    {
        if (string.IsNullOrWhiteSpace(grade) || string.IsNullOrWhiteSpace(division))
            return Fail<AttendanceRosterModel>("Choose a standard and a division.");

        var on = date ?? _clock.Today;
        if (on > _clock.Today)
            return Fail<AttendanceRosterModel>("That day has not happened yet.");

        int? yearId = await ResolveYearAsync(academicYearId);
        if (yearId == null) return Fail<AttendanceRosterModel>("No academic year is set as current.");

        var roster = await RosterAsync(grade.Trim(), division.Trim(), yearId.Value, on);
        if (roster.Students.Count == 0)
            return Fail<AttendanceRosterModel>($"No students are on the roll for {grade.Trim()}-{division.Trim()}.");

        return new ServiceResponseDto<AttendanceRosterModel> { Data = roster };
    }

    public async Task<ServiceResponseDto<AttendanceRosterModel>> SaveAsync(SaveAttendanceModel model)
    {
        if (model.Marks.Count == 0)
            return Fail<AttendanceRosterModel>("Nothing to save.");

        var grade = model.Grade.Trim();
        var division = model.Division.Trim();
        var on = model.AttendanceDate ?? _clock.Today;

        // Tomorrow's attendance cannot be known, and a date the app never showed
        // is a sign of a clock or a bug, not of a teacher's intent.
        if (on > _clock.Today)
            return Fail<AttendanceRosterModel>("That day has not happened yet.");

        int? yearId = await ResolveYearAsync(model.AcademicYearId);
        if (yearId == null) return Fail<AttendanceRosterModel>("No academic year is set as current.");

        var enrolled = await _context.StudentMasters
            .Where(s => !s.IsDeleted && s.IsActive && s.AcademicYearId == yearId
                     && s.Grade == grade && s.Division == division)
            .Select(s => s.Id)
            .ToListAsync();

        if (enrolled.Count == 0)
            return Fail<AttendanceRosterModel>($"No students are on the roll for {grade}-{division}.");

        // The class the server knows about is the one that gets marked. A mark
        // for anyone else is dropped rather than saved into the wrong class.
        var onRoll = enrolled.ToHashSet();
        var marks = model.Marks
            .Where(m => onRoll.Contains(m.StudentId))
            .GroupBy(m => m.StudentId)
            // Last write wins if a screen somehow sends a child twice.
            .ToDictionary(g => g.Key, g => g.Last().IsPresent);

        if (marks.Count == 0)
            return Fail<AttendanceRosterModel>($"None of those students are in {grade}-{division}.");

        var now = DateTime.UtcNow;
        var userId = _jwtTokenUtility.GetUserId();

        var existing = await _context.StudentAttendances
            .Where(a => !a.IsDeleted && a.AttendanceDate == on && marks.Keys.Contains(a.StudentId))
            .ToListAsync();

        foreach (var (studentId, isPresent) in marks)
        {
            var row = existing.FirstOrDefault(a => a.StudentId == studentId);
            if (row == null)
            {
                _context.StudentAttendances.Add(new StudentAttendance
                {
                    StudentId = studentId,
                    AttendanceDate = on,
                    IsPresent = isPresent,
                    CreatedById = userId,
                    UpdatedById = userId,
                    CreatedAt = now,
                    UpdatedAt = now
                });
                continue;
            }

            // Touch the audit columns even when the answer is unchanged: the
            // useful fact is that a teacher confirmed the class at this time.
            row.IsPresent = isPresent;
            row.UpdatedById = userId;
            row.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        int absent = marks.Values.Count(present => !present);
        var roster = await RosterAsync(grade, division, yearId.Value, on);

        return new ServiceResponseDto<AttendanceRosterModel>
        {
            Data = roster,
            Message = absent == 0
                ? $"{grade}-{division} marked — everyone present."
                : $"{grade}-{division} marked — {absent} absent."
        };
    }

    // ── internals ───────────────────────────────────────────────────────────

    /// <summary>Reads the class and folds in whatever is stored for the date.</summary>
    private async Task<AttendanceRosterModel> RosterAsync(
        string grade, string division, int yearId, DateOnly on)
    {
        var students = await _context.StudentMasters
            .Include(s => s.AcademicYear)
            .Where(s => !s.IsDeleted && s.IsActive && s.AcademicYearId == yearId
                     && s.Grade == grade && s.Division == division)
            .OrderBy(s => s.FirstName).ThenBy(s => s.LastName)
            .Select(s => new
            {
                s.Id,
                s.AdmissionNumber,
                s.FirstName,
                s.MiddleName,
                s.LastName,
                s.PhotoUrl,
                YearName = s.AcademicYear!.YearName
            })
            .ToListAsync();

        var ids = students.Select(s => s.Id).ToList();

        var marked = await _context.StudentAttendances
            .Where(a => !a.IsDeleted && a.AttendanceDate == on && ids.Contains(a.StudentId))
            .Select(a => new { a.StudentId, a.IsPresent, a.UpdatedAt, a.UpdatedById })
            .ToListAsync();

        var byStudent = marked.ToDictionary(a => a.StudentId, a => a.IsPresent);
        var last = marked.OrderByDescending(a => a.UpdatedAt).FirstOrDefault();

        var markedBy = last?.UpdatedById == null
            ? null
            : await _context.UserMasters
                .Where(u => u.Id == last.UpdatedById)
                .Select(u => u.Name)
                .FirstOrDefaultAsync();

        var rows = students.Select(s => new AttendanceStudentModel
        {
            StudentId = s.Id,
            AdmissionNumber = s.AdmissionNumber,
            Name = string.Join(" ", new[] { s.FirstName, s.MiddleName, s.LastName }
                .Where(part => !string.IsNullOrWhiteSpace(part))),
            PhotoUrl = s.PhotoUrl,
            IsPresent = byStudent.TryGetValue(s.Id, out var present) ? present : null
        }).ToList();

        return new AttendanceRosterModel
        {
            AttendanceDate = on,
            Grade = grade,
            Division = division,
            AcademicYearId = yearId,
            AcademicYearName = students.FirstOrDefault()?.YearName,
            TotalStudents = rows.Count,
            PresentCount = rows.Count(r => r.IsPresent == true),
            AbsentCount = rows.Count(r => r.IsPresent == false),
            UnmarkedCount = rows.Count(r => r.IsPresent == null),
            IsMarked = marked.Count > 0,
            LastMarkedAt = last?.UpdatedAt,
            LastMarkedBy = markedBy,
            Students = rows
        };
    }

    private async Task<int?> ResolveYearAsync(int? academicYearId) =>
        academicYearId
        ?? (await _context.AcademicYearMasters
                .FirstOrDefaultAsync(a => a.IsCurrent && !a.IsDeleted))?.Id;

    /// <summary>
    /// School order, not alphabetical: Nursery comes before 1st, and "10" after
    /// "9" — which a string sort gets wrong in both cases.
    /// </summary>
    private static int GradeRank(string grade)
    {
        var g = grade.Trim().ToLowerInvariant();
        if (g.StartsWith("nur")) return -3;
        if (g.StartsWith("jr") || g.StartsWith("junior")) return -2;
        if (g.StartsWith("sr") || g.StartsWith("senior")) return -1;

        var digits = new string(g.TakeWhile(char.IsDigit).ToArray());
        return int.TryParse(digits, out var n) ? n : int.MaxValue;
    }

    private static ServiceResponseDto<T> Fail<T>(string message) =>
        new() { Success = false, Message = message };
}
