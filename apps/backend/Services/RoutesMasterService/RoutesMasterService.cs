using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.RoutesMasterService;

public class RoutesMasterService : IRoutesMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public RoutesMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<RoutesMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.RoutesMasters.Where(r => !r.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(r => r.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(r =>
                r.RouteName.Contains(term) ||
                (r.RouteCode != null && r.RouteCode.Contains(term)) ||
                (r.LedDisplayName != null && r.LedDisplayName.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "routecode" => filter.Descending ? query.OrderByDescending(r => r.RouteCode) : query.OrderBy(r => r.RouteCode),
            "createdat" => filter.Descending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(r => r.RouteName) : query.OrderBy(r => r.RouteName),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoutesMasterListModel
            {
                Id = r.Id,
                RouteCode = r.RouteCode,
                RouteName = r.RouteName,
                LedDisplayName = r.LedDisplayName,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<RoutesMasterListModel>>
        {
            Data = new PagedResult<RoutesMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Routes fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<RoutesMasterListModel>> GetByIdAsync(int id)
    {
        var route = await _context.RoutesMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (route == null)
            return new ServiceResponseDto<RoutesMasterListModel> { Success = false, Message = "Route not found." };

        return new ServiceResponseDto<RoutesMasterListModel> { Data = MapToListModel(route) };
    }

    public async Task<ServiceResponseDto<RoutesMasterListModel>> CreateAsync(RoutesMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.RouteName))
            return new ServiceResponseDto<RoutesMasterListModel> { Success = false, Message = "Route name is required." };

        if (!string.IsNullOrWhiteSpace(model.RouteCode))
        {
            bool codeExists = await _context.RoutesMasters
                .AnyAsync(r => r.RouteCode == model.RouteCode.Trim() && !r.IsDeleted);
            if (codeExists)
                return new ServiceResponseDto<RoutesMasterListModel> { Success = false, Message = "A route with this code already exists." };
        }

        var currentUserId = _jwtTokenUtility.GetUserId();
        var route = new RoutesMaster
        {
            RouteCode = string.IsNullOrWhiteSpace(model.RouteCode) ? null : model.RouteCode.Trim(),
            RouteName = model.RouteName.Trim(),
            LedDisplayName = model.LedDisplayName,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.RoutesMasters.Add(route);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<RoutesMasterListModel>
        {
            Data = MapToListModel(route),
            Message = "Route created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, RoutesMasterUpdateModel model)
    {
        var route = await _context.RoutesMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (route == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Route not found." };

        if (!string.IsNullOrWhiteSpace(model.RouteCode) && model.RouteCode.Trim() != route.RouteCode)
        {
            bool codeExists = await _context.RoutesMasters
                .AnyAsync(r => r.RouteCode == model.RouteCode.Trim() && r.Id != id && !r.IsDeleted);
            if (codeExists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A route with this code already exists." };
        }

        if (model.RouteCode != null) route.RouteCode = string.IsNullOrWhiteSpace(model.RouteCode) ? null : model.RouteCode.Trim();
        if (model.RouteName != null) route.RouteName = model.RouteName.Trim();
        if (model.LedDisplayName != null) route.LedDisplayName = model.LedDisplayName;
        if (model.IsActive.HasValue) route.IsActive = model.IsActive.Value;
        route.UpdatedById = _jwtTokenUtility.GetUserId();
        route.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Route updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var route = await _context.RoutesMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (route == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Route not found." };

        // Deleting a route out from under the records that point at it is how
        // bus 06 ended up allocated to "Panvel", a route that no longer
        // existed: the bus still listed the name, and the server then refused
        // every child assigned to that bus because the route failed validation.
        // Nothing surfaced the contradiction — the bus simply stopped working.
        //
        // Same refusal as gates and academic years, for the same reason.
        bool inUse = await _context.BusesMasters.AnyAsync(b => b.RouteId == id && !b.IsDeleted)
                  || await _context.StudentMasters.AnyAsync(s => s.RouteId == id && !s.IsDeleted)
                  || await _context.BusRouteAllocations.AnyAsync(a => a.RouteId == id && !a.IsDeleted);
        if (inUse)
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = "This route is assigned to buses, students or allocations and cannot be deleted."
            };

        route.IsDeleted = true;
        route.IsActive = false;
        route.UpdatedById = _jwtTokenUtility.GetUserId();
        route.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Route deleted successfully." };
    }

    private static RoutesMasterListModel MapToListModel(RoutesMaster r) => new()
    {
        Id = r.Id,
        RouteCode = r.RouteCode,
        RouteName = r.RouteName,
        LedDisplayName = r.LedDisplayName,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt
    };
}
