using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Services.MenuAssignmentService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MenuAssignmentController : ControllerBase
{
    private readonly IMenuAssignmentService _service;

    public MenuAssignmentController(IMenuAssignmentService service)
    {
        _service = service;
    }

    [HttpPost("assign-menus")]
    public async Task<IActionResult> AssignMenusToRole([FromBody] AssignMenusToRoleModel model)
    {
        var response = await _service.AssignMenusToRoleAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("assigned/{roleId}")]
    public async Task<IActionResult> GetAssignedMenuIds(int roleId)
    {
        var response = await _service.GetAssignedMenuIdsByRoleIdAsync(roleId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("menus")]
    public async Task<IActionResult> GetAllMenusTree()
    {
        var response = await _service.GetAllMenusTreeAsync();
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("assigned-menus/{roleId}")]
    public async Task<IActionResult> GetAssignedMenusTree(int roleId)
    {
        var response = await _service.GetMenusAssignedToRoleAsync(roleId);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
