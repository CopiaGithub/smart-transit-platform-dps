using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.GateMasterService;

public interface IGateMasterService
{
    Task<ServiceResponseDto<PagedResult<GateMasterListModel>>> GetAllAsync(PaginationFilterDto filter, string? gateType = null, bool? status = null);
    Task<ServiceResponseDto<GateMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<GateMasterListModel>> CreateAsync(GateMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, GateMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
