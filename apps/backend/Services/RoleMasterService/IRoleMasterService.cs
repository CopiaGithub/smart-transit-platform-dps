using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.RoleMasterService;

public interface IRoleMasterService
{
    Task<ServiceResponseDto<PagedResult<RoleMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
    Task<ServiceResponseDto<RoleMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<RoleMasterListModel>> CreateAsync(RoleMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, RoleMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
