using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.MenuAssignmentService;

public class MenuAssignmentService : IMenuAssignmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public MenuAssignmentService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<bool>> AssignMenusToRoleAsync(AssignMenusToRoleModel model)
    {
        var roleExists = await _context.RoleMasters
            .AnyAsync(r => r.Id == model.RoleId && !r.IsDeleted);
        if (!roleExists)
            return new ServiceResponseDto<bool> { Success = false, Message = "Role not found.", Data = false };

        var menuIds = (model.MenuIds ?? new List<int>()).Distinct().ToList();
        if (menuIds.Count > 0)
        {
            var validMenuCount = await _context.MenuMasters
                .CountAsync(m => menuIds.Contains(m.Id) && !m.IsDeleted);
            if (validMenuCount != menuIds.Count)
                return new ServiceResponseDto<bool>
                {
                    Success = false,
                    Message = "One or more menu ids are invalid.",
                    Data = false
                };
        }

        var existing = await _context.MenuAssignments
            .Where(x => x.RoleId == model.RoleId && !x.IsDeleted)
            .ToListAsync();

        var currentUserId = _jwtTokenUtility.GetUserId();
        var now = DateTime.UtcNow;

        foreach (var assignment in existing)
        {
            assignment.IsDeleted = true;
            assignment.IsActive = false;
            assignment.UpdatedById = currentUserId;
            assignment.UpdatedAt = now;
        }

        var newAssignments = menuIds.Select(menuId => new MenuAssignment
        {
            RoleId = model.RoleId,
            MenuId = menuId,
            IsActive = true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = now,
            UpdatedAt = now
        });

        await _context.MenuAssignments.AddRangeAsync(newAssignments);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool>
        {
            Data = true,
            Message = "Menus assigned to role successfully."
        };
    }

    public async Task<ServiceResponseDto<List<int>>> GetAssignedMenuIdsByRoleIdAsync(int roleId)
    {
        var ids = await _context.MenuAssignments
            .AsNoTracking()
            .Where(x => x.RoleId == roleId && !x.IsDeleted && x.IsActive)
            .Select(x => x.MenuId)
            .ToListAsync();

        return new ServiceResponseDto<List<int>>
        {
            Data = ids,
            Message = "Assigned menu ids fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<List<MenuTreeModel>>> GetAllMenusTreeAsync()
    {
        var menus = await _context.MenuMasters
            .AsNoTracking()
            .Where(m => !m.IsDeleted && m.IsActive)
            .OrderBy(m => m.OrderNo)
            .ToListAsync();

        return new ServiceResponseDto<List<MenuTreeModel>>
        {
            Data = BuildMenuTree(menus),
            Message = "Menu tree fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<List<MenuTreeModel>>> GetMenusAssignedToRoleAsync(int roleId)
    {
        var menus = await _context.MenuMasters
            .AsNoTracking()
            .Join(
                _context.MenuAssignments.Where(a => a.RoleId == roleId && !a.IsDeleted && a.IsActive),
                menu => menu.Id,
                assignment => assignment.MenuId,
                (menu, _) => menu)
            .Where(m => !m.IsDeleted && m.IsActive)
            .OrderBy(m => m.OrderNo)
            .ToListAsync();

        return new ServiceResponseDto<List<MenuTreeModel>>
        {
            Data = BuildMenuTree(menus),
            Message = "Assigned menu tree fetched successfully."
        };
    }

    private static List<MenuTreeModel> BuildMenuTree(List<MenuMaster> menus, int? parentId = null)
    {
        return menus
            .Where(m => m.ParentId == parentId)
            .OrderBy(m => m.OrderNo)
            .Select(m => new MenuTreeModel
            {
                Id = m.Id,
                Name = m.Name,
                Route = m.Route,
                Icon = m.Icon,
                ParentId = m.ParentId,
                OrderNo = m.OrderNo,
                IsActive = m.IsActive,
                Children = BuildMenuTree(menus, m.Id)
            })
            .ToList();
    }
}
