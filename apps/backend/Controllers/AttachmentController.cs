using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Common;
using transit_display_platform_api.Services.AttachmentService;

namespace transit_display_platform_api.Controllers;

/// <summary>
/// Uploads for the photo fields on Student Master and Parent Master.
///
/// Admin-only, and deliberately so: these are the two screens that carry a
/// child's photograph, and the ability to put arbitrary files on the server's
/// disk is not something to hand to every signed-in role. Reading them back is
/// a different matter — the files are served as ordinary static content so an
/// <c>&lt;img&gt;</c> tag works without a bearer token, the same way the LED
/// panels read the board.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RoleNames.Admin)]
public class AttachmentController : ControllerBase
{
    private readonly IAttachmentService _service;

    public AttachmentController(IAttachmentService service)
    {
        _service = service;
    }

    /// <summary>
    /// Takes one image and answers with the path to store on the record —
    /// e.g. <c>/uploads/2026-08/9f2c….jpg</c>. The caller writes that string
    /// into StudentMaster.PhotoUrl or ParentMaster.PhotoUrl; this endpoint does
    /// not touch either table, so an upload that is never saved is just an
    /// orphaned file rather than a half-updated record.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> PostUpload(IFormFile? file)
    {
        var response = await _service.SaveImageAsync(file);
        if (!response.Success)
            return BadRequest(response.Message);

        return Ok(response);
    }
}
