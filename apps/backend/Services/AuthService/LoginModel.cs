using System.ComponentModel.DataAnnotations;

namespace transit_display_platform_api.Services.AuthService;

public class LoginRequestModel
{
    /// <summary>Email or employee code / contact used as the login identifier.</summary>
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Login payload. All user details (userId, name, emailId, employeeCode,
/// roleId, roleName) are embedded as claims inside the token itself.
/// Refresh token is intentionally excluded.
/// </summary>
public class LoginResponseModel
{
    public string Token { get; set; } = string.Empty;
    public DateTime TokenExpiresAt { get; set; }
}
