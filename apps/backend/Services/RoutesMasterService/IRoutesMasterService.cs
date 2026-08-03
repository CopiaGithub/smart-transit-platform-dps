using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.RoutesMasterService;

public interface IRoutesMasterService
{
    Task<ServiceResponseDto<PagedResult<RoutesMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
    Task<ServiceResponseDto<RoutesMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<RoutesMasterListModel>> CreateAsync(RoutesMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, RoutesMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
