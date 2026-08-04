using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.ParentMasterService;

public interface IParentMasterService
{
    Task<ServiceResponseDto<PagedResult<ParentMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
    Task<ServiceResponseDto<ParentMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<ParentMasterListModel>> GetByMobileAsync(string mobileNumber);
    Task<ServiceResponseDto<List<ParentChildModel>>> GetChildrenAsync(int id);
    Task<ServiceResponseDto<ParentMasterListModel>> CreateAsync(ParentMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, ParentMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
