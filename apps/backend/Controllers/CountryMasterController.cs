using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.CountryMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class CountryMasterController : ControllerBase
{
    private readonly ICountryMasterService _service;

    public CountryMasterController(ICountryMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetCountryMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
