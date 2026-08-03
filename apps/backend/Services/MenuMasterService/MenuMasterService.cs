using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.MenuMasterService;

public class MenuMasterService : IMenuMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public MenuMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<MenuMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? parentId = null, bool? status = null, string? searchTerm = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.MenuMasters
            .AsNoTracking()
            .Where(m => !m.IsDeleted);

        if (parentId.HasValue)
        {
            query = parentId.Value == 0
                ? query.Where(m => m.ParentId == null)
                : query.Where(m => m.ParentId == parentId.Value);
        }

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(m => m.IsActive == activeFilter.Value);

        var term = !string.IsNullOrWhiteSpace(searchTerm) ? searchTerm : filter.SearchTerm;
        if (!string.IsNullOrWhiteSpace(term))
        {
            var search = term.Trim();
            query = query.Where(m =>
                m.Name.Contains(search) ||
                (m.Route != null && m.Route.Contains(search)) ||
                (m.Icon != null && m.Icon.Contains(search)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(m => m.OrderNo)
            .ThenBy(m => m.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MenuMasterListModel
            {
                Id = m.Id,
                Name = m.Name,
                Route = m.Route,
                Icon = m.Icon,
                ParentId = m.ParentId,
                ParentName = m.Parent != null ? m.Parent.Name : null,
                OrderNo = m.OrderNo,
                IsActive = m.IsActive,
                CreatedAt = m.CreatedAt,
                ChildCount = _context.MenuMasters.Count(c => c.ParentId == m.Id && !c.IsDeleted)
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<MenuMasterListModel>>
        {
            Data = new PagedResult<MenuMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = $"Total {totalRecords} menu(s) found."
        };
    }

    public async Task<ServiceResponseDto<List<MenuMasterDropdownModel>>> GetParentMenusAsync(int? excludeId = null)
    {
        var query = _context.MenuMasters
            .AsNoTracking()
            .Where(m => !m.IsDeleted && m.ParentId == null && m.IsActive);

        if (excludeId.HasValue)
            query = query.Where(m => m.Id != excludeId.Value);

        var items = await query
            .OrderBy(m => m.OrderNo)
            .ThenBy(m => m.Name)
            .Select(m => new MenuMasterDropdownModel
            {
                Id = m.Id,
                Name = m.Name
            })
            .ToListAsync();

        return new ServiceResponseDto<List<MenuMasterDropdownModel>>
        {
            Data = items,
            Message = "Parent menus fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<MenuMasterListModel>> GetByIdAsync(int id)
    {
        var menu = await _context.MenuMasters
            .AsNoTracking()
            .Where(m => m.Id == id && !m.IsDeleted)
            .Select(m => new MenuMasterListModel
            {
                Id = m.Id,
                Name = m.Name,
                Route = m.Route,
                Icon = m.Icon,
                ParentId = m.ParentId,
                ParentName = m.Parent != null ? m.Parent.Name : null,
                OrderNo = m.OrderNo,
                IsActive = m.IsActive,
                CreatedAt = m.CreatedAt,
                ChildCount = _context.MenuMasters.Count(c => c.ParentId == m.Id && !c.IsDeleted)
            })
            .FirstOrDefaultAsync();

        if (menu == null)
            return new ServiceResponseDto<MenuMasterListModel> { Success = false, Message = "Menu not found." };

        return new ServiceResponseDto<MenuMasterListModel>
        {
            Data = menu,
            Message = "Menu fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<MenuMasterListModel>> CreateAsync(MenuMasterCreateModel model)
    {
        model.OrderNo = await GetNextOrderNoAsync(model.ParentId);

        var validationError = await ValidateMenuAsync(model.Name, model.Route, model.ParentId, model.OrderNo, null);
        if (!string.IsNullOrWhiteSpace(validationError))
            return new ServiceResponseDto<MenuMasterListModel> { Success = false, Message = validationError };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var menu = new MenuMaster
        {
            Name = model.Name!.Trim(),
            Route = NormalizeOptional(model.Route),
            Icon = NormalizeOptional(model.Icon),
            ParentId = model.ParentId,
            OrderNo = model.OrderNo,
            IsActive = model.IsActive,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedById = currentUserId
        };

        _context.MenuMasters.Add(menu);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<MenuMasterListModel>
        {
            Data = (await GetByIdAsync(menu.Id)).Data,
            Message = "Menu created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, MenuMasterUpdateModel model)
    {
        var validationError = await ValidateMenuAsync(model.Name, model.Route, model.ParentId, model.OrderNo, id);
        if (!string.IsNullOrWhiteSpace(validationError))
            return new ServiceResponseDto<bool> { Success = false, Message = validationError, Data = false };

        var menu = await _context.MenuMasters.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (menu == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Menu not found.", Data = false };

        if (model.ParentId == id)
            return new ServiceResponseDto<bool> { Success = false, Message = "A menu cannot be its own parent.", Data = false };

        if (menu.ParentId == null && model.ParentId.HasValue)
        {
            var hasChildren = await _context.MenuMasters.AnyAsync(x => x.ParentId == id && !x.IsDeleted);
            if (hasChildren)
                return new ServiceResponseDto<bool>
                {
                    Success = false,
                    Message = "A parent menu with child menus cannot be converted to a child menu.",
                    Data = false
                };
        }

        menu.Name = model.Name!.Trim();
        menu.Route = NormalizeOptional(model.Route);
        menu.Icon = NormalizeOptional(model.Icon);
        menu.ParentId = model.ParentId;
        menu.OrderNo = model.OrderNo;
        menu.IsActive = model.IsActive;
        menu.UpdatedById = _jwtTokenUtility.GetUserId();
        menu.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool> { Data = true, Message = "Menu updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> BulkUpdateAsync(List<MenuMasterBulkUpdateModel> models)
    {
        if (models == null || models.Count == 0)
            return new ServiceResponseDto<bool> { Success = false, Message = "No menu items provided for bulk update.", Data = false };

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var ids = models.Select(x => x.Id).Distinct().ToList();
            var menus = await _context.MenuMasters
                .Where(x => ids.Contains(x.Id) && !x.IsDeleted)
                .ToListAsync();

            var missingIds = ids.Except(menus.Select(x => x.Id)).ToList();
            if (missingIds.Count > 0)
                return new ServiceResponseDto<bool>
                {
                    Success = false,
                    Message = $"Menu item(s) not found: {string.Join(", ", missingIds)}",
                    Data = false
                };

            foreach (var model in models)
            {
                var menu = menus.First(x => x.Id == model.Id);
                var validationError = await ValidateMenuAsync(model.Name, model.Route, menu.ParentId, model.OrderNo, model.Id);
                if (!string.IsNullOrWhiteSpace(validationError))
                    return new ServiceResponseDto<bool>
                    {
                        Success = false,
                        Message = $"{menu.Name}: {validationError}",
                        Data = false
                    };
            }

            var currentUserId = _jwtTokenUtility.GetUserId();
            foreach (var model in models)
            {
                var menu = menus.First(x => x.Id == model.Id);
                menu.Name = model.Name!.Trim();
                menu.Route = NormalizeOptional(model.Route);
                menu.OrderNo = model.OrderNo;
                menu.IsActive = model.IsActive;
                menu.UpdatedById = currentUserId;
                menu.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new ServiceResponseDto<bool> { Data = true, Message = "Menu items updated successfully." };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = $"Failed to bulk update menus: {ex.Message}",
                Data = false
            };
        }
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var menu = await _context.MenuMasters.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (menu == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Menu not found.", Data = false };

        var hasChildren = await _context.MenuMasters.AnyAsync(x => x.ParentId == id && !x.IsDeleted);
        if (hasChildren)
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = "Delete child menus before deleting this parent menu.",
                Data = false
            };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var now = DateTime.UtcNow;

        var assignments = await _context.MenuAssignments
            .Where(x => x.MenuId == id && !x.IsDeleted)
            .ToListAsync();

        foreach (var assignment in assignments)
        {
            assignment.IsDeleted = true;
            assignment.IsActive = false;
            assignment.UpdatedById = currentUserId;
            assignment.UpdatedAt = now;
        }

        menu.IsDeleted = true;
        menu.IsActive = false;
        menu.UpdatedById = currentUserId;
        menu.UpdatedAt = now;

        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool> { Data = true, Message = "Menu deleted successfully." };
    }

    private async Task<string?> ValidateMenuAsync(string? name, string? route, int? parentId, int orderNo, int? excludeId)
    {
        var trimmedName = name?.Trim();
        var normalizedRoute = NormalizeOptional(route);

        if (string.IsNullOrWhiteSpace(trimmedName))
            return "Menu name is required.";

        if (orderNo < 0)
            return "Sequence no cannot be negative.";

        if (parentId.HasValue)
        {
            var parent = await _context.MenuMasters
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == parentId.Value && !x.IsDeleted);

            if (parent == null)
                return "Selected parent menu was not found.";

            if (parent.ParentId != null)
                return "Only two-level menus are supported. Select a top-level menu as parent.";

            if (excludeId.HasValue && parentId.Value == excludeId.Value)
                return "A menu cannot be its own parent.";

            if (string.IsNullOrWhiteSpace(normalizedRoute))
                return "Route is required for child menus.";
        }

        var duplicateName = await _context.MenuMasters.AnyAsync(x =>
            !x.IsDeleted &&
            x.Name.ToLower() == trimmedName.ToLower() &&
            x.ParentId == parentId &&
            (!excludeId.HasValue || x.Id != excludeId.Value));

        if (duplicateName)
            return "A menu with the same name already exists under this parent.";

        return null;
    }

    private async Task<int> GetNextOrderNoAsync(int? parentId)
    {
        var maxOrderNo = await _context.MenuMasters
            .Where(m => !m.IsDeleted && m.ParentId == parentId)
            .MaxAsync(m => (int?)m.OrderNo) ?? 0;

        return maxOrderNo + 1;
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
