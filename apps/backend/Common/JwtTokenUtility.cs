using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace transit_display_platform_api.Common;

public interface IJwtTokenUtility
{
    JwtUserClaims? GetCurrentUserClaims();
    int? GetUserId();
    JwtUserClaims? DecodeToken(string token);
}

public class JwtTokenUtility : IJwtTokenUtility
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public JwtTokenUtility(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public JwtUserClaims? GetCurrentUserClaims()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated == true)
            return ParseClaims(principal);

        var authHeader = _httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader) ||
            !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        return DecodeToken(token);
    }

    public int? GetUserId() => GetCurrentUserClaims()?.UserId;

    public JwtUserClaims? DecodeToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var handler = new JwtSecurityTokenHandler();
        if (!handler.CanReadToken(token))
            return null;

        var jwt = handler.ReadJwtToken(token);
        return ParseClaims(jwt.Claims);
    }

    private static JwtUserClaims? ParseClaims(ClaimsPrincipal principal)
        => ParseClaims(principal.Claims);

    private static JwtUserClaims? ParseClaims(IEnumerable<Claim> claims)
    {
        var claimList = claims.ToList();

        var userIdValue =
            claimList.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
            ?? claimList.FirstOrDefault(c => c.Type == "userId")?.Value
            ?? claimList.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrWhiteSpace(userIdValue) || !int.TryParse(userIdValue, out var userId))
            return null;

        int? roleId = null;
        var roleIdValue = claimList.FirstOrDefault(c => c.Type == "roleId")?.Value;
        if (!string.IsNullOrWhiteSpace(roleIdValue) && int.TryParse(roleIdValue, out var parsedRoleId))
            roleId = parsedRoleId;

        return new JwtUserClaims
        {
            UserId = userId,
            Username = claimList.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                ?? claimList.FirstOrDefault(c => c.Type == "name")?.Value,
            EmailId = claimList.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                ?? claimList.FirstOrDefault(c => c.Type == "emailId")?.Value,
            RoleId = roleId,
            RoleName = claimList.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value
                ?? claimList.FirstOrDefault(c => c.Type == "roleName")?.Value
        };
    }
}
