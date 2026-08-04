using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.ParentMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ParentMasterController : ControllerBase
{
    private readonly IParentMasterService _service;

    public ParentMasterController(IParentMasterService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetParentMaster(
        [FromQuery] PaginationFilterDto filter,
        [FromQuery] bool? status)
    {
        var response = await _service.GetAllAsync(filter, status);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetParentMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpGet("by-mobile/{mobileNumber}")]
    public async Task<IActionResult> GetParentMasterByMobile(string mobileNumber)
    {
        var response = await _service.GetByMobileAsync(mobileNumber);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Every child linked to this parent — one call for the parent app home screen.</summary>
    [HttpGet("{id}/children")]
    public async Task<IActionResult> GetParentChildren(int id)
    {
        var response = await _service.GetChildrenAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> PostParentMaster([FromBody] ParentMasterCreateModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.CreateAsync(model);
        if (!response.Success)
            return BadRequest(response.Message);

        return CreatedAtAction(nameof(GetParentMasterById), new { id = response.Data?.Id }, response);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> PatchParentMaster(int id, [FromBody] ParentMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteParentMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
