using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.MenuMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class MenuMasterController : ControllerBase
{
    private readonly IMenuMasterService _service;

    public MenuMasterController(IMenuMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetMenus(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? parentId,
        [FromQuery] bool? status,
        [FromQuery] string? searchTerm)
    {
        var response = await _service.GetAllAsync(filter, parentId, status, searchTerm);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("parents")]
    public async Task<IActionResult> GetParentMenus([FromQuery] int? excludeId)
    {
        var response = await _service.GetParentMenusAsync(excludeId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMenu(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> CreateMenu([FromBody] MenuMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetMenu), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateMenu(int id, [FromBody] MenuMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpPatch("bulk-update")]
    public async Task<IActionResult> BulkUpdateMenus([FromBody] List<MenuMasterBulkUpdateModel> models)
    {
        var response = await _service.BulkUpdateAsync(models);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenu(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
