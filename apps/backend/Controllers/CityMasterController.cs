using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.CityMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CityMasterController : ControllerBase
{
    private readonly ICityMasterService _service;

    public CityMasterController(ICityMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetCityMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? stateId,
        [FromQuery] int? regionId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, stateId, regionId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
