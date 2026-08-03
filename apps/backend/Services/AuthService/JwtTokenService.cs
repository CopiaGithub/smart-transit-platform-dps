using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using transit_display_platform_api.Common;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.AuthService;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public TokenResult GenerateTokens(UserMaster user)
    {
        var now = DateTime.UtcNow;
        var accessTokenExpiresAt = now.AddMinutes(_settings.AccessTokenExpiryMinutes);
        var refreshTokenExpiresAt = now.AddDays(_settings.RefreshTokenExpiryDays);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("userId", user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new("name", user.Name),
            new("emailId", user.EmailId ?? string.Empty),
            new("employeeCode", user.EmployeeCode ?? string.Empty),
            new("roleId", user.RoleId?.ToString() ?? string.Empty),
            new("roleName", user.Role?.RoleName ?? string.Empty),
        };

        if (!string.IsNullOrWhiteSpace(user.EmailId))
            claims.Add(new Claim(ClaimTypes.Email, user.EmailId));
        if (!string.IsNullOrWhiteSpace(user.Role?.RoleName))
            claims.Add(new Claim(ClaimTypes.Role, user.Role!.RoleName));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now,
            expires: accessTokenExpiresAt,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        return new TokenResult(accessToken, accessTokenExpiresAt, GenerateRefreshToken(), refreshTokenExpiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
