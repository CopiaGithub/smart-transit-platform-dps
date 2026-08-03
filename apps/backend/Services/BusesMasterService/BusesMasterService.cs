using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.BusesMasterService;

public class BusesMasterService : IBusesMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public BusesMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<BusesMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? routeId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.BusesMasters
            .Include(b => b.Route)
            .Where(b => !b.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(b => b.IsActive == activeFilter.Value);

        if (routeId.HasValue)
            query = query.Where(b => b.RouteId == routeId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(b =>
                b.BusNumber.Contains(term) ||
                b.BusType.Contains(term) ||
                (b.Route != null && b.Route.RouteName.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "bustype" => filter.Descending ? query.OrderByDescending(b => b.BusType) : query.OrderBy(b => b.BusType),
            "createdat" => filter.Descending ? query.OrderByDescending(b => b.CreatedAt) : query.OrderBy(b => b.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(b => b.BusNumber) : query.OrderBy(b => b.BusNumber),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BusesMasterListModel
            {
                Id = b.Id,
                BusNumber = b.BusNumber,
                RouteId = b.RouteId,
                RouteName = b.Route != null ? b.Route.RouteName : null,
                BusType = b.BusType,
                IsActive = b.IsActive,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<BusesMasterListModel>>
        {
            Data = new PagedResult<BusesMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Buses fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<BusesMasterListModel>> GetByIdAsync(int id)
    {
        var bus = await _context.BusesMasters
            .Include(b => b.Route)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (bus == null)
            return new ServiceResponseDto<BusesMasterListModel> { Success = false, Message = "Bus not found." };

        return new ServiceResponseDto<BusesMasterListModel> { Data = MapToListModel(bus) };
    }

    public async Task<ServiceResponseDto<BusesMasterListModel>> CreateAsync(BusesMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.BusNumber))
            return new ServiceResponseDto<BusesMasterListModel> { Success = false, Message = "Bus number is required." };

        bool exists = await _context.BusesMasters
            .AnyAsync(b => b.BusNumber == model.BusNumber.Trim() && !b.IsDeleted);
        if (exists)
            return new ServiceResponseDto<BusesMasterListModel> { Success = false, Message = "A bus with this number already exists." };

        if (model.RouteId.HasValue)
        {
            bool routeExists = await _context.RoutesMasters
                .AnyAsync(r => r.Id == model.RouteId.Value && !r.IsDeleted);
            if (!routeExists)
                return new ServiceResponseDto<BusesMasterListModel> { Success = false, Message = "Selected route was not found." };
        }

        var currentUserId = _jwtTokenUtility.GetUserId();
        var bus = new BusesMaster
        {
            BusNumber = model.BusNumber.Trim(),
            RouteId = model.RouteId,
            BusType = string.IsNullOrWhiteSpace(model.BusType) ? "Active" : model.BusType.Trim(),
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BusesMasters.Add(bus);
        await _context.SaveChangesAsync();
        await _context.Entry(bus).Reference(b => b.Route).LoadAsync();

        return new ServiceResponseDto<BusesMasterListModel>
        {
            Data = MapToListModel(bus),
            Message = "Bus created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, BusesMasterUpdateModel model)
    {
        var bus = await _context.BusesMasters.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
        if (bus == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Bus not found." };

        if (!string.IsNullOrWhiteSpace(model.BusNumber) && model.BusNumber.Trim() != bus.BusNumber)
        {
            bool exists = await _context.BusesMasters
                .AnyAsync(b => b.BusNumber == model.BusNumber.Trim() && b.Id != id && !b.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A bus with this number already exists." };
        }

        if (model.RouteId.HasValue)
        {
            bool routeExists = await _context.RoutesMasters
                .AnyAsync(r => r.Id == model.RouteId.Value && !r.IsDeleted);
            if (!routeExists)
                return new ServiceResponseDto<bool> { Success = false, Message = "Selected route was not found." };
        }

        if (model.BusNumber != null) bus.BusNumber = model.BusNumber.Trim();
        if (model.RouteId.HasValue) bus.RouteId = model.RouteId;
        if (model.BusType != null) bus.BusType = model.BusType.Trim();
        if (model.IsActive.HasValue) bus.IsActive = model.IsActive.Value;
        bus.UpdatedById = _jwtTokenUtility.GetUserId();
        bus.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Bus updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var bus = await _context.BusesMasters.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);
        if (bus == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Bus not found." };

        bus.IsDeleted = true;
        bus.IsActive = false;
        bus.UpdatedById = _jwtTokenUtility.GetUserId();
        bus.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Bus deleted successfully." };
    }

    private static BusesMasterListModel MapToListModel(BusesMaster b) => new()
    {
        Id = b.Id,
        BusNumber = b.BusNumber,
        RouteId = b.RouteId,
        RouteName = b.Route?.RouteName,
        BusType = b.BusType,
        IsActive = b.IsActive,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };
}
