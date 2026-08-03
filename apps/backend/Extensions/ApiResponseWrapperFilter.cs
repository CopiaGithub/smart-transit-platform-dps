using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using transit_display_platform_api.Common;

namespace transit_display_platform_api.Extensions;

/// <summary>
/// Wraps every controller action result in the uniform <see cref="ApiResponse{T}"/>
/// envelope. Runs even when other filters short-circuit the pipeline.
/// File/redirect results and already-wrapped responses are left untouched.
/// </summary>
public class ApiResponseWrapperFilter : IAsyncAlwaysRunResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        switch (context.Result)
        {
            // Ok(x) / BadRequest(x) / NotFound(x) / CreatedAtAction(...) etc.
            case ObjectResult objectResult when objectResult.Value is not ApiResponse<object>:
            {
                // Real code goes inside the envelope; HTTP status is always 200.
                int statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
                context.Result = new ObjectResult(BuildEnvelope(objectResult.Value, statusCode))
                {
                    StatusCode = StatusCodes.Status200OK
                };
                break;
            }

            // NoContent() / Ok() / StatusCode(...) with no body.
            case StatusCodeResult statusCodeResult:
            {
                int statusCode = statusCodeResult.StatusCode;
                context.Result = new ObjectResult(BuildEnvelope(null, statusCode))
                {
                    StatusCode = StatusCodes.Status200OK
                };
                break;
            }
        }

        await next();
    }

    private static ApiResponse<object> BuildEnvelope(object? value, int statusCode)
    {
        bool isSuccess = statusCode is >= 200 and < 400;

        // Flatten ServiceResponseDto<T> so Result carries the actual payload
        // and the service Message surfaces as ErrorMessage on failures.
        if (value is IServiceResponse serviceResponse)
        {
            bool ok = isSuccess && serviceResponse.Success;
            return new ApiResponse<object>
            {
                Success = ok,
                Result = ok ? serviceResponse.DataObject : null,
                StatusCode = statusCode,
                ErrorMessage = ok ? null : NullIfEmpty(serviceResponse.Message)
            };
        }

        if (!isSuccess)
        {
            return new ApiResponse<object>
            {
                Success = false,
                Result = null,
                StatusCode = statusCode,
                ErrorMessage = ExtractErrorMessage(value)
            };
        }

        return new ApiResponse<object>
        {
            Success = true,
            Result = value,
            StatusCode = statusCode,
            ErrorMessage = null
        };
    }

    private static string? ExtractErrorMessage(object? value) => value switch
    {
        null => null,
        string s => NullIfEmpty(s),
        ValidationProblemDetails => "One or more validation errors occurred.",
        ProblemDetails pd => pd.Detail ?? pd.Title,
        _ => value.ToString()
    };

    private static string? NullIfEmpty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s;
}
