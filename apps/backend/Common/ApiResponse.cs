namespace transit_display_platform_api.Common;

/// <summary>
/// Uniform response envelope returned by every API endpoint.
/// Shape: { Success, Result, StatusCode, ErrorMessage }.
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Result { get; set; }
    public int StatusCode { get; set; }
    public string? ErrorMessage { get; set; }

    public static ApiResponse<T> Ok(T? result, int statusCode = 200) => new()
    {
        Success = true,
        Result = result,
        StatusCode = statusCode,
        ErrorMessage = null
    };

    public static ApiResponse<T> Fail(string? errorMessage, int statusCode = 400) => new()
    {
        Success = false,
        Result = default,
        StatusCode = statusCode,
        ErrorMessage = errorMessage
    };
}

/// <summary>
/// Non-generic view over <see cref="ServiceResponseDto{T}"/> so the response
/// wrapper can flatten service results into the envelope without reflection.
/// </summary>
public interface IServiceResponse
{
    bool Success { get; }
    string Message { get; }
    object? DataObject { get; }
}
