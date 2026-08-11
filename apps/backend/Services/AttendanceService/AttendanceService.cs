using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;
using transit_display_platform_api.Services.BusRouteAllocationService;

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
    private readonly IBusRouteAllocationService _allocations;

    public AttendanceService(
        ApplicationDbContext context,
        IJwtTokenUtility jwtTokenUtility,
        ISchoolClock clock,
        IBusRouteAllocationService allocations)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _clock = clock;
        _allocations = allocations;
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

    public async Task<ServiceResponseDto<List<BusRollCallModel>>> GetByBusAsync(
        DateOnly? date = null, int? academicYearId = null)
    {
        var on = date ?? _clock.Today;
        if (on > _clock.Today)
            return Fail<List<BusRollCallModel>>("That day has not happened yet.");

        int? yearId = await ResolveYearAsync(academicYearId);
        if (yearId == null) return Fail<List<BusRollCallModel>>("No academic year is set as current.");

        // Only children the school actually puts on a bus. UsesTransport is the
        // school's own flag; a null route means nobody has placed them on one yet,
        // and either way there is no bus for them to hold up.
        var enrolled = await _context.StudentMasters
            .Where(s => !s.IsDeleted && s.IsActive && s.AcademicYearId == yearId
                     && s.UsesTransport && s.RouteId != null)
            .Select(s => new
            {
                s.Id,
                s.AdmissionNumber,
                s.FirstName,
                s.MiddleName,
                s.LastName,
                s.Grade,
                s.Division,
                RouteId = s.RouteId!.Value,
                RouteName = s.Route!.RouteName
            })
            .ToListAsync();

        // Resolved for `on`, not for today: a roll call read back for last Tuesday
        // must group children under the bus that actually ran their route that day,
        // reserve substitutions included.
        var busByRoute = await _allocations.ResolveBusesForRoutesAsync(
            enrolled.Select(r => r.RouteId).Distinct().ToList(), on);

        var busIds = busByRoute.Values.Distinct().ToList();
        var busNumbers = busIds.Count == 0
            ? new Dictionary<int, string>()
            : await _context.BusesMasters
                .Where(b => busIds.Contains(b.Id) && !b.IsDeleted)
                .ToDictionaryAsync(b => b.Id, b => b.BusNumber);

        // A route with no bus in force on the date has no roll call to show.
        var riders = enrolled
            .Where(r => busByRoute.ContainsKey(r.RouteId))
            .Select(r => new
            {
                r.Id,
                r.AdmissionNumber,
                r.FirstName,
                r.MiddleName,
                r.LastName,
                r.Grade,
                r.Division,
                BusId = busByRoute[r.RouteId],
                BusNumber = busNumbers.TryGetValue(busByRoute[r.RouteId], out var number) ? number : string.Empty,
                r.RouteName
            })
            .ToList();

        if (riders.Count == 0)
            return new ServiceResponseDto<List<BusRollCallModel>> { Data = new(), TotalRecords = 0 };

        var riderIds = riders.Select(r => r.Id).ToList();

        var marks = await _context.StudentAttendances
            .Where(a => !a.IsDeleted && a.AttendanceDate == on && riderIds.Contains(a.StudentId))
            .Select(a => new { a.StudentId, a.IsPresent })
            .ToListAsync();

        var byStudent = marks.ToDictionary(a => a.StudentId, a => a.IsPresent);

        var buses = riders
            .GroupBy(r => new { r.BusId, r.BusNumber, r.RouteName })
            .Select(g =>
            {
                // Three states, not two: marked present, marked absent, and nobody
                // has said. The third is why PresentCount alone is not enough to
                // tell a teacher the bus is ready to go.
                var marked = g
                    .Select(r => new { Rider = r, Present = Look(byStudent, r.Id) })
                    .ToList();

                return new BusRollCallModel
                {
                    BusId = g.Key.BusId,
                    BusNumber = g.Key.BusNumber,
                    RouteName = g.Key.RouteName,
                    TotalStudents = marked.Count,
                    PresentCount = marked.Count(m => m.Present == true),
                    AbsentCount = marked.Count(m => m.Present == false),
                    UnmarkedCount = marked.Count(m => m.Present == null),
                    Absentees = marked
                        .Where(m => m.Present == false)
                        .Select(m => new BusRollCallStudentModel
                        {
                            StudentId = m.Rider.Id,
                            AdmissionNumber = m.Rider.AdmissionNumber,
                            Name = FullName(m.Rider.FirstName, m.Rider.MiddleName, m.Rider.LastName),
                            Class = $"{m.Rider.Grade}-{m.Rider.Division}"
                        })
                        .OrderBy(s => s.Name)
                        .ToList()
                };
            })
            .OrderBy(b => b.BusNumber)
            .ToList();

        return new ServiceResponseDto<List<BusRollCallModel>>
        {
            Data = buses,
            TotalRecords = buses.Count
        };
    }

    // ── internals ───────────────────────────────────────────────────────────

    private static bool? Look(Dictionary<int, bool> marks, int studentId) =>
        marks.TryGetValue(studentId, out var present) ? present : null;

    private static string FullName(string first, string? middle, string last) =>
        string.Join(" ", new[] { first, middle, last }
            .Where(part => !string.IsNullOrWhiteSpace(part)));

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
                YearName = s.AcademicYear!.YearName,
                // Nullable FK, so this becomes a LEFT JOIN and reads null for a
                // child who walks home. `!` silences the compiler, not the database.
                RouteName = s.Route!.RouteName,
                s.RouteId,
                s.UsesTransport
            })
            .ToListAsync();

        // The bus is the route's, resolved for the day being viewed.
        var rosterBusByRoute = await _allocations.ResolveBusesForRoutesAsync(
            students
                .Where(s => s.UsesTransport && s.RouteId.HasValue)
                .Select(s => s.RouteId!.Value)
                .Distinct()
                .ToList(),
            on);

        var rosterBusIds = rosterBusByRoute.Values.Distinct().ToList();
        var rosterBusNumbers = rosterBusIds.Count == 0
            ? new Dictionary<int, string>()
            : await _context.BusesMasters
                .Where(b => rosterBusIds.Contains(b.Id) && !b.IsDeleted)
                .ToDictionaryAsync(b => b.Id, b => b.BusNumber);

        string? BusNumberFor(int? routeId, bool usesTransport) =>
            usesTransport
            && routeId.HasValue
            && rosterBusByRoute.TryGetValue(routeId.Value, out var busId)
            && rosterBusNumbers.TryGetValue(busId, out var number)
                ? number
                : null;

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
            Name = FullName(s.FirstName, s.MiddleName, s.LastName),
            PhotoUrl = s.PhotoUrl,
            IsPresent = byStudent.TryGetValue(s.Id, out var present) ? present : null,
            BusNumber = BusNumberFor(s.RouteId, s.UsesTransport),
            RouteName = s.RouteName
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
