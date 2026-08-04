using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.BusRouteAllocationService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BusRouteAllocationController : ControllerBase
{
    private readonly IBusRouteAllocationService _service;

    public BusRouteAllocationController(IBusRouteAllocationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetBusRouteAllocation(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? routeId,
        [FromQuery] int? busId,
        [FromQuery] string? allocationType,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, routeId, busId, allocationType, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBusRouteAllocationById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// Which bus runs which route on a date, with same-day overrides already applied.
    /// Omit the date for today.
    /// </summary>
    [HttpGet("for-date")]
    public async Task<IActionResult> GetForDate([FromQuery] DateOnly? date)
    {
        var response = await _service.GetForDateAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date));
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostBusRouteAllocation([FromBody] BusRouteAllocationCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetBusRouteAllocationById), new { id = response.Data?.Id }, response);
    }

    /// <summary>
    /// Swap in a reserve bus for one date. Leaves the standing allocation intact, so
    /// the route reverts to its usual bus tomorrow without anyone remembering to undo it.
    /// </summary>
    [HttpPost("substitute")]
    public async Task<IActionResult> PostSubstitute([FromBody] SubstituteBusModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.SubstituteAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchBusRouteAllocation(int id, [FromBody] BusRouteAllocationUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBusRouteAllocation(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
