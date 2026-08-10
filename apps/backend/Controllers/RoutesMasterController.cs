using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.RoutesMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class RoutesMasterController : ControllerBase
{
    private readonly IRoutesMasterService _service;

    public RoutesMasterController(IRoutesMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoutesMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoutesMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostRoutesMaster([FromBody] RoutesMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetRoutesMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchRoutesMaster(int id, [FromBody] RoutesMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoutesMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
