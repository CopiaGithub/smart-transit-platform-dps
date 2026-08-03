using System.Text.Json;
using Microsoft.AspNetCore.Http.Extensions;
using transit_display_platform_api.Common;

namespace transit_display_platform_api.Extensions;

/// <summary>
/// Catches unhandled exceptions and un-routed requests (no matching endpoint)
/// and emits them in the uniform <see cref="ApiResponse{T}"/> envelope, so
/// responses that never reach a controller still share the same shape.
/// </summary>
public class ApiResponseMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiResponseMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null // PascalCase to match the envelope contract
    };

    public ApiResponseMiddleware(
        RequestDelegate next,
        ILogger<ApiResponseMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            // Un-routed request: nothing wrote a body and status is 404.
            if (context.Response is { HasStarted: false, StatusCode: StatusCodes.Status404NotFound }
                && context.GetEndpoint() is null)
            {
                await WriteEnvelopeAsync(
                    context,
                    StatusCodes.Status404NotFound,
                    $"No HTTP resource was found that matches the request URI '{context.Request.GetDisplayUrl()}'.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Path}", context.Request.Path);

            if (context.Response.HasStarted)
                throw;

            string message = _env.IsDevelopment() ? ex.Message : "An unexpected error occurred.";
            await WriteEnvelopeAsync(context, StatusCodes.Status500InternalServerError, message);
        }
    }

    private static async Task WriteEnvelopeAsync(HttpContext context, int statusCode, string errorMessage)
    {
        context.Response.Clear();
        // HTTP status is always 200; the real code lives in the envelope.
        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.ContentType = "application/json";

        var envelope = ApiResponse<object>.Fail(errorMessage, statusCode);
        await context.Response.WriteAsync(JsonSerializer.Serialize(envelope, JsonOptions));
    }
}
