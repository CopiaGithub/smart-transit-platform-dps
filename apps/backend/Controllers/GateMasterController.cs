using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.GateMasterService;

namespace transit_display_platform_api.Controllers;

/// <summary>
/// Readable by anyone signed in, changeable only by an admin.
///
/// The app cannot work out which post a guard is on without this list — the user
/// record has no gate field, so the gate is matched out of the role name against
/// these rows. Gate names are painted on the walls of the compound; there is
/// nothing here to keep from a signed-in member of staff.
///
/// Roles widen on the class and narrow on each write: ASP.NET Core ANDs the two
/// levels, so a class restricted to Admin could never be reopened by a method.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GateMasterController : ControllerBase
{
    private readonly IGateMasterService _service;

    public GateMasterController(IGateMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetGateMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] string? gateType,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, gateType, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGateMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> PostGateMaster([FromBody] GateMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetGateMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> PatchGateMaster(int id, [FromBody] GateMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> DeleteGateMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
