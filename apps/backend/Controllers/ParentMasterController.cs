using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.ParentMasterService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
/// <summary>
/// Admin, except for the two calls the parent app itself makes — and those are
/// pinned to the caller's own record. Parent rows carry children's names, classes
/// and bus allocations, so an id in the URL must never be enough on its own.
///
/// The class admits both roles and every admin-only action says so itself, rather
/// than the reverse: ASP.NET Core ANDs the class-level [Authorize] with the
/// method-level one, so a class restricted to Admin would lock parents out of
/// their own two endpoints no matter what those endpoints allowed.
/// </summary>
[Authorize(Roles = RoleNames.AdminOrParent)]
public class ParentMasterController : ControllerBase
{
    private readonly IParentMasterService _service;
    private readonly IJwtTokenUtility _jwt;

    public ParentMasterController(IParentMasterService service, IJwtTokenUtility jwt)
    {
        _service = service;
        _jwt = jwt;
    }

    private bool IsAdmin => User.IsInRole(RoleNames.Admin);

    /// <summary>
    /// The parent record this caller is allowed to read, or null for an admin, who
    /// may read any. Returns null-with-false for a parent whose token has no usable
    /// userId — the caller then refuses rather than falling open.
    /// </summary>
    private async Task<(bool Allowed, int? OwnParentId)> OwnParentIdAsync()
    {
        if (IsAdmin) return (true, null);

        var userId = _jwt.GetUserId();
        if (userId is null) return (false, null);

        var own = await _service.GetByUserIdAsync(userId.Value);
        return own.Success && own.Data is not null ? (true, own.Data.Id) : (false, null);
    }

    /// <summary>Every parent in the school — an admin list, not a parent's own view.</summary>
    [HttpGet]
    [Authorize(Roles = RoleNames.Admin)]
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
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> GetParentMasterById(int id)
    {
        var response = await _service.GetByIdAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpGet("by-mobile/{mobileNumber}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> GetParentMasterByMobile(string mobileNumber)
    {
        var response = await _service.GetByMobileAsync(mobileNumber);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>
    /// The parent record behind a sign-in account. The parent app calls this
    /// first, with the userId from its own token, to find out who it is.
    /// </summary>
    [HttpGet("by-user/{userId:int}")]
    public async Task<IActionResult> GetParentMasterByUserId(int userId)
    {
        // A parent may look up only themselves. The userId in the URL is the
        // caller's to type, so it is checked against the token rather than trusted.
        if (!IsAdmin && _jwt.GetUserId() != userId)
            return Forbid();

        var response = await _service.GetByUserIdAsync(userId);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    /// <summary>Every child linked to this parent — one call for the parent app home screen.</summary>
    [HttpGet("{id}/children")]
    public async Task<IActionResult> GetParentChildren(int id)
    {
        // `id` is a parent-record id, not a user id, so it cannot be compared to the
        // token directly — the caller's own parent row has to be resolved first.
        var (allowed, ownParentId) = await OwnParentIdAsync();
        if (!allowed || (ownParentId is not null && ownParentId != id))
            return Forbid();

        var response = await _service.GetChildrenAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = RoleNames.Admin)]
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
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> PatchParentMaster(int id, [FromBody] ParentMasterUpdateModel model)
    {
        var response = await _service.UpdateAsync(id, model);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.Admin)]
    public async Task<IActionResult> DeleteParentMaster(int id)
    {
        var response = await _service.DeleteAsync(id);
        if (!response.Success)
            return NotFound(response.Message);

        return Ok(response);
    }
}
