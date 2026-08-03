using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.UserMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserMasterController : ControllerBase
{
    private readonly IUserMasterService _service;

    public UserMasterController(IUserMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? roleId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, roleId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostUserMaster([FromBody] UserMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetUserMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchUserMaster(int id, [FromBody] UserMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPatch("bulk-status-update")]
    public async Task<IActionResult> BulkUpdateStatus([FromBody] ChangeStatusModel model)
    {
        var response = await _service.BulkUpdateStatusAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUserMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
