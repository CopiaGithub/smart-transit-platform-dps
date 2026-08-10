using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.PinCodeMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class PinCodeMasterController : ControllerBase
{
    private readonly IPinCodeMasterService _service;

    public PinCodeMasterController(IPinCodeMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetPinCodeMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? cityId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, cityId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
