using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.DispersalSessionService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DispersalSessionController : ControllerBase
{
    private readonly IDispersalSessionService _service;

    public DispersalSessionController(IDispersalSessionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetDispersalSession(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] string? sessionStatus,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, sessionStatus, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>The session gate operators are working against right now.</summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSession()
    {
        var response = await _service.GetCurrentAsync();
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDispersalSessionById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost("open")]
    [Authorize(Roles = "Admin,Gate 6 Operator")]
    public async Task<IActionResult> PostOpenSession([FromBody] OpenSessionModel model)
    {
        var response = await _service.OpenAsync(model ?? new OpenSessionModel());
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetDispersalSessionById), new { id = response.Data?.Id }, response);
    }

    [HttpPost("{id}/close")]
    [Authorize(Roles = "Admin,Gate 6 Operator,Gate 1 Operator")]
    public async Task<IActionResult> PostCloseSession(int id)
    {
        var response = await _service.CloseAsync(id);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// End-of-day clear. Departs anything still holding a platform, so a session is
    /// never left with buses stranded on the board.
    /// </summary>
    [HttpPost("{id}/reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PostResetSession(int id)
    {
        var response = await _service.ResetAsync(id);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
