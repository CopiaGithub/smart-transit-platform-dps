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
        PaginationFilterDto filter, int? routeId = null, bool? status = null,
        string? busType = null, string? serviceStatus = null)
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

        // Exact match, unlike SearchTerm below which does a fuzzy Contains over
        // BusType among other columns — "Reserve" here must mean only Reserve.
        if (!string.IsNullOrWhiteSpace(busType))
            query = query.Where(b => b.BusType == busType);

        if (!string.IsNullOrWhiteSpace(serviceStatus))
            query = query.Where(b => b.ServiceStatus == serviceStatus);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(b =>
                b.BusNumber.Contains(term) ||
                b.BusType.Contains(term) ||
                (b.Route != null && !b.Route.IsDeleted && b.Route.RouteName.Contains(term)));
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
                RegistrationNumber = b.RegistrationNumber,
                RouteId = b.RouteId,
                // A soft-deleted route is still reachable through the navigation
                // property — there is no global query filter — so it has to be
                // excluded by hand. Printing the name of a route the validator
                // will reject is what made bus 06 look healthy while every
                // allocation to it failed.
                RouteName = b.Route != null && !b.Route.IsDeleted ? b.Route.RouteName : null,
                BusType = b.BusType,
                ServiceStatus = b.ServiceStatus,
                OutOfServiceReason = b.OutOfServiceReason,
                Capacity = b.Capacity,
                DriverName = b.DriverName,
                DriverPhone = b.DriverPhone,
                DriverLicenceNumber = b.DriverLicenceNumber,
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

        var busType = string.IsNullOrWhiteSpace(model.BusType) ? BusKind.Active : model.BusType.Trim();
        if (!BusKind.All.Contains(busType))
            return Fail($"Bus type must be one of: {string.Join(", ", BusKind.All)}.");

        var serviceStatus = string.IsNullOrWhiteSpace(model.ServiceStatus)
            ? BusServiceState.InService
            : model.ServiceStatus.Trim();
        if (!BusServiceState.All.Contains(serviceStatus))
            return Fail($"Service status must be one of: {string.Join(", ", BusServiceState.All)}.");

        if (model.Capacity is <= 0)
            return Fail("Capacity must be greater than zero.");

        var currentUserId = _jwtTokenUtility.GetUserId();
        var bus = new BusesMaster
        {
            BusNumber = model.BusNumber.Trim(),
            RegistrationNumber = NullIfBlank(model.RegistrationNumber),
            RouteId = model.RouteId,
            BusType = busType,
            ServiceStatus = serviceStatus,
            // A reason only makes sense while the bus is out; keeping a stale one
            // would show "Gearbox failure" against a bus that is back on the road.
            OutOfServiceReason = serviceStatus == BusServiceState.InService
                ? null
                : model.OutOfServiceReason?.Trim(),
            Capacity = model.Capacity,
            DriverName = model.DriverName?.Trim(),
            DriverPhone = model.DriverPhone?.Trim(),
            DriverLicenceNumber = model.DriverLicenceNumber?.Trim(),
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

        if (model.BusType != null && !BusKind.All.Contains(model.BusType.Trim()))
            return FailBool($"Bus type must be one of: {string.Join(", ", BusKind.All)}.");

        if (model.ServiceStatus != null && !BusServiceState.All.Contains(model.ServiceStatus.Trim()))
            return FailBool($"Service status must be one of: {string.Join(", ", BusServiceState.All)}.");

        if (model.Capacity is <= 0)
            return FailBool("Capacity must be greater than zero.");

        if (model.BusNumber != null) bus.BusNumber = model.BusNumber.Trim();
        // Sending "" deliberately clears the plate; omitting the field leaves it alone.
        if (model.RegistrationNumber != null) bus.RegistrationNumber = NullIfBlank(model.RegistrationNumber);
        if (model.RouteId.HasValue) bus.RouteId = model.RouteId;
        if (model.BusType != null) bus.BusType = model.BusType.Trim();
        if (model.ServiceStatus != null) bus.ServiceStatus = model.ServiceStatus.Trim();
        if (model.OutOfServiceReason != null) bus.OutOfServiceReason = model.OutOfServiceReason.Trim();
        if (model.Capacity.HasValue) bus.Capacity = model.Capacity;
        if (model.DriverName != null) bus.DriverName = model.DriverName.Trim();
        if (model.DriverPhone != null) bus.DriverPhone = model.DriverPhone.Trim();
        if (model.DriverLicenceNumber != null) bus.DriverLicenceNumber = model.DriverLicenceNumber.Trim();
        if (model.IsActive.HasValue) bus.IsActive = model.IsActive.Value;

        // Returning to service clears the reason, whether or not the caller sent one.
        if (bus.ServiceStatus == BusServiceState.InService)
            bus.OutOfServiceReason = null;

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

        // The same hole routes had: children carry a BusId, so deleting the bus
        // leaves them pointing at a vehicle that is not there — and the parent
        // screen would still print its number.
        bool hasRiders = await _context.StudentMasters.AnyAsync(s => s.BusId == id && !s.IsDeleted);
        if (hasRiders)
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = "Students are allocated to this bus and it cannot be deleted."
            };

        // A bus that is still in a dispersal has to finish it. Past sessions are
        // history and must keep their bus, so only live events block.
        bool onTheBoard = await _context.BoardingEvents
            .AnyAsync(e => e.BusId == id && !e.IsDeleted && BoardingStatus.Live.Contains(e.Status));
        if (onTheBoard)
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = "This bus is on the board right now and cannot be deleted."
            };

        bus.IsDeleted = true;
        bus.IsActive = false;
        bus.UpdatedById = _jwtTokenUtility.GetUserId();
        bus.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Bus deleted successfully." };
    }

    private static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static BusesMasterListModel MapToListModel(BusesMaster b) => new()
    {
        Id = b.Id,
        BusNumber = b.BusNumber,
        RegistrationNumber = b.RegistrationNumber,
        RouteId = b.RouteId,
        // See the list projection: a deleted route must not be named here either.
        RouteName = b.Route is { IsDeleted: false } ? b.Route.RouteName : null,
        BusType = b.BusType,
        ServiceStatus = b.ServiceStatus,
        OutOfServiceReason = b.OutOfServiceReason,
        Capacity = b.Capacity,
        DriverName = b.DriverName,
        DriverPhone = b.DriverPhone,
        DriverLicenceNumber = b.DriverLicenceNumber,
        IsActive = b.IsActive,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };

    private static ServiceResponseDto<BusesMasterListModel> Fail(string message) =>
        new() { Success = false, Message = message };

    private static ServiceResponseDto<bool> FailBool(string message) =>
        new() { Success = false, Message = message };
}
