using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.AuthService;

public interface IAuthService
{
    Task<ServiceResponseDto<LoginResponseModel>> LoginAsync(LoginRequestModel request);
}
