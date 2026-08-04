using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.DisplayMasterService;

public interface IDisplayMasterService
{
    Task<ServiceResponseDto<PagedResult<DisplayMasterListModel>>> GetAllAsync(PaginationFilterDto filter, string? displayType = null, bool? status = null);
    Task<ServiceResponseDto<DisplayMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<DisplayMasterListModel>> CreateAsync(DisplayMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, DisplayMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);

    /// <summary>Called by the panel itself to report that it is alive.</summary>
    Task<ServiceResponseDto<bool>> RecordHeartbeatAsync(string displayCode);
}
