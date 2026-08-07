using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Extensions;

// When stdout is a pipe rather than a terminal — which is exactly what
// `dotnet run` gives us, and what Docker and CI give us too — .NET buffers it
// in blocks. The startup lines then sit unwritten until the buffer fills, so a
// server that is running perfectly well looks like it has hung, and a server
// that crashed looks the same. Flushing every write costs nothing at this
// volume and makes the log say what is happening when it happens.
Console.SetOut(new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });
Console.SetError(new StreamWriter(Console.OpenStandardError()) { AutoFlush = true });

// Console as well as the file. Anything that kills the app before the real
// logger is configured — a missing connection string, a bad setting — is
// reported by this one, and a file-only bootstrap logger means the terminal
// shows nothing at all. The process just disappears.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("Logs/bootstrap-.txt", rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    builder.Services.AddControllers(options =>
        {
            options.Filters.Add<ApiResponseWrapperFilter>();
        })
        .AddJsonOptions(options =>
        {
            // PascalCase keys to match the uniform response envelope contract.
            options.JsonSerializerOptions.PropertyNamingPolicy = null;
        });

    // Surface model-binding/validation failures through the same envelope.
    builder.Services.Configure<ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errorMessage = string.Join(" ", context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(m => !string.IsNullOrWhiteSpace(m)));

            return new BadRequestObjectResult(
                string.IsNullOrWhiteSpace(errorMessage)
                    ? "One or more validation errors occurred."
                    : errorMessage);
        };
    });

    builder.Services.AddApplicationServices();
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

    // JWT authentication
    var jwtSection = builder.Configuration.GetSection("JwtSettings");
    builder.Services.Configure<JwtSettings>(jwtSection);
    var jwtSettings = jwtSection.Get<JwtSettings>() ?? new JwtSettings();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter JWT token"
        });
        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        await DatabaseSeeder.ResetLegacyPasswordsAsync(db, app.Configuration, logger);
        await DemoDataSeeder.SeedAsync(db, app.Configuration, logger);
        // Last, so it overwrites whatever the demo seeder just created.
        await DevLoginsSeeder.ApplyAsync(db, app.Configuration, app.Environment, logger);
        await DevLoginsSeeder.ClearOpenSessionBoardAsync(db, app.Configuration, app.Environment, logger);
    }

    // Envelope for unhandled exceptions and un-routed (404) requests.
    app.UseMiddleware<ApiResponseMiddleware>();

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    Log.Information("Application starting");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
