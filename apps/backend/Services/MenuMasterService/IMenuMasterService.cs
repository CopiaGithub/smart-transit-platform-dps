using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.MenuMasterService;

public interface IMenuMasterService
{
    Task<ServiceResponseDto<PagedResult<MenuMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? parentId = null, bool? status = null, string? searchTerm = null);
    Task<ServiceResponseDto<List<MenuMasterDropdownModel>>> GetParentMenusAsync(int? excludeId = null);
    Task<ServiceResponseDto<MenuMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<MenuMasterListModel>> CreateAsync(MenuMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, MenuMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> BulkUpdateAsync(List<MenuMasterBulkUpdateModel> models);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
