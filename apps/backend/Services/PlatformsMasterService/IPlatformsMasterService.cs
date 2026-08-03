using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.PlatformsMasterService;

public interface IPlatformsMasterService
{
    Task<ServiceResponseDto<PagedResult<PlatformsMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
    Task<ServiceResponseDto<PlatformsMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<PlatformsMasterListModel>> CreateAsync(PlatformsMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, PlatformsMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
