using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.AuthService;

public record TokenResult(string AccessToken, DateTime AccessTokenExpiresAt);

public interface IJwtTokenService
{
    TokenResult GenerateToken(UserMaster user);
}
