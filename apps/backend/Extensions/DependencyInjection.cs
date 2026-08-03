using transit_display_platform_api.Services.AuthService;
using transit_display_platform_api.Services.UserMasterService;

namespace transit_display_platform_api.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUserMasterService, UserMasterService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
