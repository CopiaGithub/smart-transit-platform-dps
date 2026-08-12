using System.Runtime.InteropServices;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Extensions;
using transit_display_platform_api.Services.AttachmentService;

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

    // The web app is the first browser client — the mobile app is native and
    // never needed this. Without it every request fails at the preflight.
    // Origins come from Cors:AllowedOrigins so production does not have to
    // ship a code change.
    const string webAppCorsPolicy = "WebAppCors";
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? new[] { "http://localhost:4200" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy(webAppCorsPolicy, policy =>
        {
            policy.AllowAnyHeader().AllowAnyMethod();

            if (builder.Environment.IsDevelopment())
            {
                // `ng serve` picks a different port whenever 4200 is taken, so
                // pinning one port means CORS breaks at random during dev.
                // Any loopback origin is allowed here — and only here.
                policy.SetIsOriginAllowed(origin =>
                    Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                    (uri.IsLoopback || uri.Host is "localhost" or "127.0.0.1" or "[::1]"));
            }
            else
            {
                policy.WithOrigins(allowedOrigins);
            }
        });
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

    var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();

    // On a deployed server the log file is the only thing we can look at, so it
    // has to say which build of the app this is, which appsettings file won, and
    // where it is reading from. Every "it works locally" question starts here.
    startupLogger.LogInformation(
        "Starting {Application} | Environment: {Environment} | ContentRoot: {ContentRoot} | Runtime: {Runtime} | Process: {ProcessId} {ProcessPath}",
        app.Environment.ApplicationName,
        app.Environment.EnvironmentName,
        app.Environment.ContentRootPath,
        RuntimeInformation.FrameworkDescription,
        Environment.ProcessId,
        Environment.ProcessPath);

    // Server and database only — the password never goes near the log file.
    var connectionString = app.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(connectionString))
    {
        var connection = new SqlConnectionStringBuilder(connectionString);
        startupLogger.LogInformation(
            "Database target {Server}/{Database}",
            connection.DataSource,
            connection.InitialCatalog);
    }
    else
    {
        startupLogger.LogError("No DefaultConnection connection string is configured; every request that touches the database will fail.");
    }

    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var addresses = app.Services.GetService<IServer>()?.Features.Get<IServerAddressesFeature>()?.Addresses;
        startupLogger.LogInformation(
            "Application started, listening on {Addresses}",
            addresses is { Count: > 0 } ? string.Join(", ", addresses) : "the address supplied by the host");
    });
    app.Lifetime.ApplicationStopping.Register(() => startupLogger.LogInformation("Application stopping"));
    app.Lifetime.ApplicationStopped.Register(() => startupLogger.LogInformation("Application stopped"));

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            await DatabaseSeeder.ResetLegacyPasswordsAsync(db, app.Configuration, logger);
            await DemoDataSeeder.SeedAsync(db, app.Configuration, logger);
            // Last, so it overwrites whatever the demo seeder just created.
            await DevLoginsSeeder.ApplyAsync(db, app.Configuration, app.Environment, logger);
            await DevLoginsSeeder.ClearOpenSessionBoardAsync(db, app.Configuration, app.Environment, logger);
        }
        catch (Exception ex)
        {
            // Startup seeding runs before the first request, so a failure here
            // takes the whole process down. Naming it beats reading a stack
            // trace whose top frame is the host builder.
            logger.LogCritical(ex, "Database startup work failed; the application cannot serve requests.");
            throw;
        }
    }

    // Envelope for unhandled exceptions and un-routed (404) requests.
    app.UseMiddleware<ApiResponseMiddleware>();

    // Inside the envelope middleware, so the status recorded here is the real
    // one rather than the 200 the envelope rewrites it to, and ahead of
    // everything else so Swagger, CORS preflights and 404s are all logged.
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "{RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms for {ClientIp} as {User}";

        options.GetLevel = (httpContext, elapsedMs, exception) =>
            exception is not null || httpContext.Response.StatusCode >= 500 ? LogEventLevel.Error
            : httpContext.Response.StatusCode >= 400 || elapsedMs > 2000 ? LogEventLevel.Warning
            : LogEventLevel.Information;

        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            var request = httpContext.Request;
            diagnosticContext.Set("ClientIp", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
            diagnosticContext.Set("User", httpContext.User.Identity?.Name ?? "anonymous");
            diagnosticContext.Set("Host", request.Host.Value);
            diagnosticContext.Set("Scheme", request.Scheme);
            diagnosticContext.Set("QueryString", request.QueryString.Value);
            diagnosticContext.Set("UserAgent", request.Headers.UserAgent.ToString());
            diagnosticContext.Set("Endpoint", httpContext.GetEndpoint()?.DisplayName ?? "none");
        };
    });

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseHttpsRedirection();

    // Before authentication: a preflight carries no credentials, so it has to be
    // answered before anything can reject it.
    app.UseCors(webAppCorsPolicy);

    app.UseAuthentication();
    app.UseAuthorization();

    // Uploaded photos, served as plain static files so an <img> tag can read one
    // without a bearer token — the same reasoning as the anonymous board feed.
    //
    // Scoped to its own folder and its own request path rather than turning on
    // static hosting for the whole content root, which would expose
    // appsettings.json and the Logs directory sitting next to it. Nothing here
    // is executed: FileServer only reads, and every stored name is a GUID with
    // an image extension the server chose.
    //
    // Every step is failure-tolerant on purpose. Creating this folder used to run
    // unguarded during startup and took the entire API down with a 500.30 on IIS,
    // where the app pool identity cannot write beside the deployed site. Photos
    // are one field on two screens; they are not worth the dispersal board.
    var uploadRoot = AttachmentService.ResolveRoot(app.Configuration, app.Environment);
    if (!AttachmentService.TryPrepareRoot(uploadRoot, out var uploadRootError))
    {
        startupLogger.LogWarning(
            "Photo uploads are disabled: the upload folder {UploadRoot} could not be created ({Error}). " +
            "Point Uploads:RootPath at a folder the app pool can write to, or grant it write access. " +
            "Everything else runs normally.",
            uploadRoot, uploadRootError);
    }
    else
    {
        // An allow-list of exactly the image types the uploader accepts, not the
        // framework's default map. ServeUnknownFileTypes=false alone is not the
        // same thing: .txt, .html and .svg are all *known* types, so a stray file
        // in this folder would happily be served. With only these mapped,
        // anything else is unknown and refused.
        var uploadContentTypes = new FileExtensionContentTypeProvider(
            new Dictionary<string, string>
            {
                [".jpg"] = "image/jpeg",
                [".jpeg"] = "image/jpeg",
                [".png"] = "image/png",
                [".webp"] = "image/webp",
            });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(uploadRoot),
            RequestPath = AttachmentService.RequestPath,
            ContentTypeProvider = uploadContentTypes,
            ServeUnknownFileTypes = false,
        });

        startupLogger.LogInformation(
            "Photo uploads enabled, serving {RequestPath} from {UploadRoot}",
            AttachmentService.RequestPath, uploadRoot);
    }

    app.MapControllers();

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
