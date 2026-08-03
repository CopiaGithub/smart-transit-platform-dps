using Microsoft.AspNetCore.Mvc;
using transit_display_platform_api.Services.AuthService;

namespace transit_display_platform_api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService service)
    {
        _service = service;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestModel request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _service.LoginAsync(request);
        if (!response.Success)
            return Unauthorized(response.Message);

        return Ok(response);
    }
}
