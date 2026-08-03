namespace transit_display_platform_api.Common;

public class ServiceResponseDto<T> : IServiceResponse
{
    public T? Data { get; set; }
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public int? TotalRecords { get; set; }

    object? IServiceResponse.DataObject => Data;
}
