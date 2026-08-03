using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.UserMasterService;

public interface IUserMasterService
{
    Task<ServiceResponseDto<PagedResult<UserMasterListModel>>> GetAllAsync(PaginationFilterDto filter, int? roleId = null, bool? status = null);
    Task<ServiceResponseDto<UserMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<UserMasterListModel>> CreateAsync(UserMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, UserMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
