using transit_display_platform_api.Common;
using transit_display_platform_api.Services.AcademicYearMasterService;
using transit_display_platform_api.Services.AttendanceService;
using transit_display_platform_api.Services.AuthService;
using transit_display_platform_api.Services.BusOperationsService;
using transit_display_platform_api.Services.BusRouteAllocationService;
using transit_display_platform_api.Services.BusesMasterService;
using transit_display_platform_api.Services.CityMasterService;
using transit_display_platform_api.Services.CountryMasterService;
using transit_display_platform_api.Services.DispersalSessionService;
using transit_display_platform_api.Services.DisplayMasterService;
using transit_display_platform_api.Services.GateMasterService;
using transit_display_platform_api.Services.MenuAssignmentService;
using transit_display_platform_api.Services.MenuMasterService;
using transit_display_platform_api.Services.ParentMasterService;
using transit_display_platform_api.Services.PinCodeMasterService;
using transit_display_platform_api.Services.PlatformsMasterService;
using transit_display_platform_api.Services.RegionMasterService;
using transit_display_platform_api.Services.RoleMasterService;
using transit_display_platform_api.Services.RoutesMasterService;
using transit_display_platform_api.Services.StateMasterService;
using transit_display_platform_api.Services.StudentMasterService;
using transit_display_platform_api.Services.StudentParentMappingService;
using transit_display_platform_api.Services.UserMasterService;

namespace transit_display_platform_api.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        // Stateless and config-driven, so one instance serves every request.
        services.AddSingleton<ISchoolClock, SchoolClock>();
        services.AddScoped<IJwtTokenUtility, JwtTokenUtility>();
        services.AddScoped<IUserMasterService, UserMasterService>();
        services.AddScoped<IRoleMasterService, RoleMasterService>();
        services.AddScoped<IRoutesMasterService, RoutesMasterService>();
        services.AddScoped<IBusesMasterService, BusesMasterService>();
        services.AddScoped<IPlatformsMasterService, PlatformsMasterService>();
        services.AddScoped<ICountryMasterService, CountryMasterService>();
        services.AddScoped<IRegionMasterService, RegionMasterService>();
        services.AddScoped<IStateMasterService, StateMasterService>();
        services.AddScoped<ICityMasterService, CityMasterService>();
        services.AddScoped<IPinCodeMasterService, PinCodeMasterService>();
        services.AddScoped<IMenuMasterService, MenuMasterService>();
        services.AddScoped<IMenuAssignmentService, MenuAssignmentService>();
        services.AddScoped<IGateMasterService, GateMasterService>();
        services.AddScoped<IDisplayMasterService, DisplayMasterService>();
        services.AddScoped<IAcademicYearMasterService, AcademicYearMasterService>();
        services.AddScoped<IStudentMasterService, StudentMasterService>();
        services.AddScoped<IParentMasterService, ParentMasterService>();
        services.AddScoped<IStudentParentMappingService, StudentParentMappingService>();
        services.AddScoped<IBusRouteAllocationService, BusRouteAllocationService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<IDispersalSessionService, DispersalSessionService>();
        services.AddScoped<IBusOperationsService, BusOperationsService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
