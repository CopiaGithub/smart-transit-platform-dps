using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.RegionMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class RegionMasterController : ControllerBase
{
    private readonly IRegionMasterService _service;

    public RegionMasterController(IRegionMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetRegionMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? countryId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, countryId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
