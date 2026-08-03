using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.BusesMasterService;

public interface IBusesMasterService
{
    Task<ServiceResponseDto<PagedResult<BusesMasterListModel>>> GetAllAsync(PaginationFilterDto filter, int? routeId = null, bool? status = null);
    Task<ServiceResponseDto<BusesMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<BusesMasterListModel>> CreateAsync(BusesMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, BusesMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
