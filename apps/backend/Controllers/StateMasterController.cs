using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.StateMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class StateMasterController : ControllerBase
{
    private readonly IStateMasterService _service;

    public StateMasterController(IStateMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetStateMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? countryId,
        [FromQuery] int? regionId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, countryId, regionId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
