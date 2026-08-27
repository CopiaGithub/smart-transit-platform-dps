using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.BusOperationsService;

namespace transit_display_platform_api.Controllers;

/// <summary>
/// The gate touchscreens and the LED panels. Either gate's operator may record a
/// movement in either direction — posts get covered mid-shift and the app has to
/// follow — while the service keeps the queue honest and the audit keeps the name.
/// See <see cref="RoleNames.AnyGateOperator"/>.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BusOperationsController : ControllerBase
{
    private readonly IBusOperationsService _service;

    public BusOperationsController(IBusOperationsService service)
    {
        _service = service;
    }

    /// <summary>Entry gate: one tap assigns the next platform.</summary>
    [HttpPost("gate-in")]
    [Authorize(Roles = RoleNames.AnyGateOperator)]
    public async Task<IActionResult> PostGateIn([FromBody] GateInModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.GateInAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpPost("{eventId}/boarding")]
    [Authorize(Roles = RoleNames.AnyGateOperatorOrTeacher)]
    public async Task<IActionResult> PostStartBoarding(int eventId)
    {
        var response = await _service.StartBoardingAsync(eventId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>Exit gate: marks the bus departed and frees its platform.</summary>
    [HttpPost("gate-out")]
    [Authorize(Roles = RoleNames.AnyGateOperator)]
    public async Task<IActionResult> PostGateOut([FromBody] GateOutModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.GateOutAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>Breakdown: the reserve inherits the route and the platform.</summary>
    [HttpPost("{eventId}/replace")]
    [Authorize(Roles = RoleNames.AnyGateOperator)]
    public async Task<IActionResult> PostReplace(int eventId, [FromBody] ReplaceBusModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.ReplaceAsync(eventId, model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>Breakdown by bus: works whether or not the bus has reached the gate yet.</summary>
    [HttpPost("replace-bus")]
    [Authorize(Roles = RoleNames.AnyGateOperator)]
    public async Task<IActionResult> PostReplaceByBus([FromBody] ReplaceByBusModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.ReplaceByBusAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>Undo the most recent assignment. Single step, per the SOP.</summary>
    [HttpPost("undo-last")]
    [Authorize(Roles = RoleNames.AnyGateOperator)]
    public async Task<IActionResult> PostUndoLast()
    {
        var response = await _service.UndoLastAssignmentAsync();
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// The airport-style board. Anonymous because the LED panels are unattended
    /// devices on the wired LAN with no user to authenticate as — same reasoning as
    /// the display heartbeat. Pass a display code to scope an indoor panel to its exit.
    /// </summary>
    [HttpGet("board")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBoard([FromQuery] string? displayCode)
    {
        var response = await _service.GetBoardAsync(displayCode);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Operator console: yard, waiting buses, and what is still available.</summary>
    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
    {
        var response = await _service.GetQueueAsync();
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Fleet status for the current session: available, in the yard, out of service.</summary>
    [HttpGet("buses/status")]
    public async Task<IActionResult> GetBusStatus()
    {
        var response = await _service.GetBusStatusAsync();
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Every marked platform and whether it is free or held right now.</summary>
    [HttpGet("platforms/status")]
    public async Task<IActionResult> GetPlatformStatus()
    {
        var response = await _service.GetPlatformStatusAsync();
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
