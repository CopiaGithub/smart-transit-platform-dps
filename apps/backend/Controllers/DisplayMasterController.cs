using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.DisplayMasterService;

namespace transit_display_platform_api.Controllers;

/// <summary>
/// Readable by anyone who works a dispersal, changeable only by an admin.
///
/// The roles widen here and narrow on each write, rather than the other way round:
/// ASP.NET Core ANDs a class-level [Authorize] with a method-level one, so a
/// method can never let in somebody the class has already excluded. Putting Admin
/// on the class and Teacher on a GET locks the teacher out of the GET.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.AnyGateOperatorOrTeacher)]
public class DisplayMasterController : ControllerBase
{
    private readonly IDisplayMasterService _service;

    public DisplayMasterController(IDisplayMasterService service)
    {
        _service = service;
    }

    /// <summary>The Live Board's wall picker is built from this.</summary>
    [HttpGet]
    public async Task<IActionResult> GetDisplayMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] string? displayType,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, displayType, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDisplayMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> PostDisplayMaster([FromBody] DisplayMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetDisplayMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> PatchDisplayMaster(int id, [FromBody] DisplayMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> DeleteDisplayMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// Called by the LED panel itself on a timer. Anonymous because the panels are
    /// unattended devices on the wired LAN with no user to authenticate as.
    /// </summary>
    [HttpPost("{displayCode}/heartbeat")]
    [AllowAnonymous]
    public async Task<IActionResult> PostHeartbeat(string displayCode)
    {
        var response = await _service.RecordHeartbeatAsync(displayCode);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
