using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.StudentParentMappingService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class StudentParentMappingController : ControllerBase
{
    private readonly IStudentParentMappingService _service;

    public StudentParentMappingController(IStudentParentMappingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudentParentMapping(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? studentId,
        [FromQuery] int? parentId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, studentId, parentId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudentParentMappingById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostStudentParentMapping([FromBody] StudentParentMappingCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetStudentParentMappingById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchStudentParentMapping(int id, [FromBody] StudentParentMappingUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudentParentMapping(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
