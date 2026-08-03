namespace transit_display_platform_api.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register application services here, e.g.:
        // services.AddScoped<IBusService, BusService>();

        return services;
    }
}
