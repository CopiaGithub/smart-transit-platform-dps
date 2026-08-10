using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.AttendanceService;

namespace transit_display_platform_api.Controllers;

/// <summary>
/// Class attendance. A teacher marks their own class; an admin can read and
/// correct any of it. Nobody else has a reason to see a roll of children's
/// names, so this is the one controller where the default <c>[Authorize]</c>
/// would be too generous.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Teacher + "," + RoleNames.Admin)]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;

    public AttendanceController(IAttendanceService service)
    {
        _service = service;
    }

    /// <summary>Standards and divisions that have students, for the pickers.</summary>
    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses([FromQuery] int? academicYearId)
    {
        var response = await _service.GetClassesAsync(academicYearId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>The class roster for a date, with whatever is already marked.</summary>
    [HttpGet("roster")]
    public async Task<IActionResult> GetRoster(
        [FromQuery] string grade,
        [FromQuery] string division,
        [FromQuery] DateOnly? date,
        [FromQuery] int? academicYearId)
    {
        var response = await _service.GetRosterAsync(grade, division, date, academicYearId);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// The day's attendance per bus instead of per class — what the boarding screen
    /// reads to tell a teacher how many children a bus is waiting for, and which of
    /// them never came to school.
    /// </summary>
    [HttpGet("by-bus")]
    public async Task<IActionResult> GetByBus(
        [FromQuery] DateOnly? date,
        [FromQuery] int? academicYearId)
    {
        var response = await _service.GetByBusAsync(date, academicYearId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>Saves the marks and answers with the roster as it now stands.</summary>
    [HttpPost]
    public async Task<IActionResult> PostAttendance([FromBody] SaveAttendanceModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.SaveAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
