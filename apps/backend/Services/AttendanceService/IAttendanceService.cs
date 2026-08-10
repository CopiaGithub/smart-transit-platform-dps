using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.AttendanceService;

public interface IAttendanceService
{
    /// <summary>Grade/division pairs that actually have students, for the pickers.</summary>
    Task<ServiceResponseDto<List<ClassListModel>>> GetClassesAsync(int? academicYearId = null);

    /// <summary>The class roster for a date, carrying whatever is already recorded.</summary>
    Task<ServiceResponseDto<AttendanceRosterModel>> GetRosterAsync(
        string grade, string division, DateOnly? date = null, int? academicYearId = null);

    /// <summary>Records the marks, replacing anything already saved for that day.</summary>
    Task<ServiceResponseDto<AttendanceRosterModel>> SaveAsync(SaveAttendanceModel model);

    /// <summary>
    /// The day's attendance turned round the other way: per bus rather than per
    /// class, so the boarding screen can say how many children a bus is waiting for
    /// and which of them never came to school.
    /// </summary>
    Task<ServiceResponseDto<List<BusRollCallModel>>> GetByBusAsync(
        DateOnly? date = null, int? academicYearId = null);
}
