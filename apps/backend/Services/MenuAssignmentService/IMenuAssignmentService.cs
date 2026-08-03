using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.MenuAssignmentService;

public interface IMenuAssignmentService
{
    Task<ServiceResponseDto<bool>> AssignMenusToRoleAsync(AssignMenusToRoleModel model);
    Task<ServiceResponseDto<List<int>>> GetAssignedMenuIdsByRoleIdAsync(int roleId);
    Task<ServiceResponseDto<List<MenuTreeModel>>> GetAllMenusTreeAsync();
    Task<ServiceResponseDto<List<MenuTreeModel>>> GetMenusAssignedToRoleAsync(int roleId);
}
