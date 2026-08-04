using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.DispersalSessionService;

public interface IDispersalSessionService
{
    Task<ServiceResponseDto<PagedResult<DispersalSessionListModel>>> GetAllAsync(
        PaginationFilterDto filter, string? sessionStatus = null, bool? status = null);

    Task<ServiceResponseDto<DispersalSessionListModel>> GetByIdAsync(int id);

    /// <summary>The session gate operators are currently working against.</summary>
    Task<ServiceResponseDto<DispersalSessionListModel>> GetCurrentAsync();

    /// <summary>The open session entity, for services that need to write against it.</summary>
    Task<Schema.Sessions?> CurrentSessionAsync();

    Task<ServiceResponseDto<DispersalSessionListModel>> OpenAsync(OpenSessionModel model);
    Task<ServiceResponseDto<bool>> CloseAsync(int id);

    /// <summary>End-of-day clear: departs anything still holding a platform.</summary>
    Task<ServiceResponseDto<bool>> ResetAsync(int id);
}
