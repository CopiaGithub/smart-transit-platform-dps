using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.StudentMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class StudentMasterController : ControllerBase
{
    private readonly IStudentMasterService _service;

    public StudentMasterController(IStudentMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudentMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] int? academicYearId,
        [FromQuery] string? grade,
        [FromQuery] string? division,
        [FromQuery] int? busId,
        [FromQuery] int? exitGateId,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, academicYearId, grade, division, busId, exitGateId, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudentMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Resolves an RFID card scan to a student.</summary>
    [HttpGet("by-rfid/{rfidTag}")]
    public async Task<IActionResult> GetStudentMasterByRfid(string rfidTag)
    {
        var response = await _service.GetByRfidTagAsync(rfidTag);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Every contact linked to this student, primary first.</summary>
    [HttpGet("{id}/parents")]
    public async Task<IActionResult> GetStudentParents(int id)
    {
        var response = await _service.GetParentsAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostStudentMaster([FromBody] StudentMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetStudentMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchStudentMaster(int id, [FromBody] StudentMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStudentMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
