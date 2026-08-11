using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.BusRouteAllocationService;

public class BusRouteAllocationService : IBusRouteAllocationService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;
    private readonly ISchoolClock _clock;

    public BusRouteAllocationService(
        ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility, ISchoolClock clock)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _clock = clock;
    }

    // ------------------------------------------------------------------ queries

    public async Task<ServiceResponseDto<PagedResult<BusRouteAllocationListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? routeId = null, int? busId = null,
        string? allocationType = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = BaseQuery();

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(a => a.IsActive == activeFilter.Value);

        if (routeId.HasValue) query = query.Where(a => a.RouteId == routeId.Value);
        if (busId.HasValue) query = query.Where(a => a.BusId == busId.Value);
        if (!string.IsNullOrWhiteSpace(allocationType))
            query = query.Where(a => a.AllocationType == allocationType);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(a =>
                a.Route!.RouteName.Contains(term) ||
                a.Bus!.BusNumber.Contains(term));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "busnumber" => filter.Descending ? query.OrderByDescending(a => a.Bus!.BusNumber) : query.OrderBy(a => a.Bus!.BusNumber),
            "createdat" => filter.Descending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt),
            _ => filter.Descending
                ? query.OrderByDescending(a => a.EffectiveFrom).ThenByDescending(a => a.RouteId)
                : query.OrderBy(a => a.Route!.RouteName).ThenByDescending(a => a.EffectiveFrom),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => MapToListModel(a))
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<BusRouteAllocationListModel>>
        {
            Data = new PagedResult<BusRouteAllocationListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Allocations fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<BusRouteAllocationListModel>> GetByIdAsync(int id)
    {
        var item = await BaseQuery().Where(a => a.Id == id).Select(a => MapToListModel(a)).FirstOrDefaultAsync();
        if (item == null)
            return Fail("Allocation not found.");

        return new ServiceResponseDto<BusRouteAllocationListModel> { Data = item };
    }

    public async Task<ServiceResponseDto<List<ResolvedAllocationModel>>> GetForDateAsync(DateOnly date)
    {
        var candidates = await BaseQuery()
            .Where(a => a.IsActive && a.EffectiveFrom <= date
                     && (a.EffectiveTo == null || a.EffectiveTo >= date))
            .ToListAsync();

        // An override for the date beats the standing row for that route.
        var resolved = candidates
            .GroupBy(a => a.RouteId)
            .Select(g => g.OrderByDescending(a => a.AllocationType == AllocationKind.Override)
                          .ThenByDescending(a => a.EffectiveFrom)
                          .First())
            .Select(a => new ResolvedAllocationModel
            {
                RouteId = a.RouteId,
                RouteName = a.Route?.RouteName ?? string.Empty,
                LedDisplayName = a.Route?.LedDisplayName,
                BusId = a.BusId,
                BusNumber = a.Bus?.BusNumber ?? string.Empty,
                BusType = a.Bus?.BusType ?? string.Empty,
                AllocationType = a.AllocationType,
                Reason = a.Reason
            })
            .OrderBy(r => r.RouteName)
            .ToList();

        return new ServiceResponseDto<List<ResolvedAllocationModel>>
        {
            Data = resolved,
            TotalRecords = resolved.Count,
            Message = $"Allocations resolved for {date:yyyy-MM-dd}."
        };
    }

    public async Task<int?> ResolveRouteForBusAsync(int busId, DateOnly date)
    {
        var match = await ResolveAsync(a => a.BusId == busId, date);
        return match?.RouteId;
    }

    public async Task<int?> ResolveBusForRouteAsync(int routeId, DateOnly date)
    {
        var match = await ResolveAsync(a => a.RouteId == routeId, date);
        return match?.BusId;
    }

    public async Task<Dictionary<int, int>> ResolveBusesForRoutesAsync(
        IReadOnlyCollection<int> routeIds, DateOnly date)
    {
        if (routeIds.Count == 0)
            return new Dictionary<int, int>();

        var candidates = await InForceOn(date)
            .Where(a => routeIds.Contains(a.RouteId))
            .Select(a => new { a.RouteId, a.BusId, a.AllocationType, a.EffectiveFrom })
            .ToListAsync();

        // Same precedence as ResolveAsync, applied per route in memory so the whole
        // set costs one round trip.
        return candidates
            .GroupBy(a => a.RouteId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(a => a.AllocationType == AllocationKind.Override)
                      .ThenByDescending(a => a.EffectiveFrom)
                      .First().BusId);
    }

    public async Task<List<int>> ResolveRoutesForBusAsync(int busId, DateOnly date)
    {
        var candidateRoutes = await InForceOn(date)
            .Where(a => a.BusId == busId)
            .Select(a => a.RouteId)
            .Distinct()
            .ToListAsync();

        // A standing row is not enough: if an override handed that route to another
        // bus for the date, it is not this bus's route. Resolve and keep what lands back.
        var resolved = await ResolveBusesForRoutesAsync(candidateRoutes, date);
        return resolved.Where(pair => pair.Value == busId).Select(pair => pair.Key).ToList();
    }

    /// <summary>
    /// The single rule used everywhere: an Override covering the date wins; failing
    /// that, the Standing row whose range contains it. Kept in one place so gate-in
    /// and the allocation screens can never disagree.
    /// </summary>
    private async Task<BusRouteAllocation?> ResolveAsync(
        System.Linq.Expressions.Expression<Func<BusRouteAllocation, bool>> match, DateOnly date)
    {
        return await InForceOn(date)
            .Where(match)
            .OrderByDescending(a => a.AllocationType == AllocationKind.Override)
            .ThenByDescending(a => a.EffectiveFrom)
            .FirstOrDefaultAsync();
    }

    /// <summary>Allocations alive on a date, before precedence is applied.</summary>
    private IQueryable<BusRouteAllocation> InForceOn(DateOnly date) =>
        _context.BusRouteAllocations
            .Where(a => !a.IsDeleted && a.IsActive
                     && a.EffectiveFrom <= date
                     && (a.EffectiveTo == null || a.EffectiveTo >= date));

    // ------------------------------------------------------------------- writes

    public async Task<ServiceResponseDto<BusRouteAllocationListModel>> CreateAsync(
        BusRouteAllocationCreateModel model)
    {
        if (!AllocationKind.All.Contains(model.AllocationType))
            return Fail($"Allocation type must be one of: {string.Join(", ", AllocationKind.All)}.");

        if (model.EffectiveFrom == default)
            return Fail("Effective from date is required.");

        // An override is a single-day fact by definition.
        var effectiveTo = model.AllocationType == AllocationKind.Override
            ? model.EffectiveFrom
            : model.EffectiveTo;

        if (effectiveTo.HasValue && effectiveTo < model.EffectiveFrom)
            return Fail("Effective to date cannot be before the effective from date.");

        var referenceError = await ValidateReferencesAsync(model.RouteId, model.BusId);
        if (referenceError != null)
            return Fail(referenceError);

        var clashError = await FindOverlapAsync(
            null, model.RouteId, model.BusId, model.AllocationType, model.EffectiveFrom, effectiveTo);
        if (clashError != null)
            return Fail(clashError);

        var currentUserId = _jwtTokenUtility.GetUserId();
        var allocation = new BusRouteAllocation
        {
            RouteId = model.RouteId,
            BusId = model.BusId,
            AllocationType = model.AllocationType,
            EffectiveFrom = model.EffectiveFrom,
            EffectiveTo = effectiveTo,
            Reason = model.Reason,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BusRouteAllocations.Add(allocation);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<BusRouteAllocationListModel>
        {
            Data = await BaseQuery().Where(a => a.Id == allocation.Id).Select(a => MapToListModel(a)).FirstAsync(),
            Message = "Allocation created successfully."
        };
    }

    /// <summary>
    /// The 11th-hour reserve swap from the brief: records a one-day override for the
    /// route without touching the standing allocation, so tomorrow reverts by itself.
    /// </summary>
    public async Task<ServiceResponseDto<BusRouteAllocationListModel>> SubstituteAsync(SubstituteBusModel model)
    {
        // "Today" means the school's calendar day, not UTC's — see SchoolClock.
        var date = model.Date ?? _clock.Today;

        var referenceError = await ValidateReferencesAsync(model.RouteId, model.ReplacementBusId);
        if (referenceError != null)
            return Fail(referenceError);

        var existing = await _context.BusRouteAllocations.FirstOrDefaultAsync(a =>
            a.RouteId == model.RouteId && a.AllocationType == AllocationKind.Override
            && a.EffectiveFrom == date && !a.IsDeleted);

        var currentUserId = _jwtTokenUtility.GetUserId();
        var reason = model.Reason ?? "Same-day substitution.";

        if (existing != null)
        {
            existing.BusId = model.ReplacementBusId;
            existing.Reason = reason;
            existing.IsActive = true;
            existing.UpdatedById = currentUserId;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ServiceResponseDto<BusRouteAllocationListModel>
            {
                Data = await BaseQuery().Where(a => a.Id == existing.Id).Select(a => MapToListModel(a)).FirstAsync(),
                Message = "Substitution updated for this date."
            };
        }

        return await CreateAsync(new BusRouteAllocationCreateModel
        {
            RouteId = model.RouteId,
            BusId = model.ReplacementBusId,
            AllocationType = AllocationKind.Override,
            EffectiveFrom = date,
            Reason = reason
        });
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, BusRouteAllocationUpdateModel model)
    {
        var allocation = await _context.BusRouteAllocations.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (allocation == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Allocation not found." };

        int routeId = model.RouteId ?? allocation.RouteId;
        int busId = model.BusId ?? allocation.BusId;
        var from = model.EffectiveFrom ?? allocation.EffectiveFrom;
        var to = model.EffectiveTo ?? allocation.EffectiveTo;

        if (allocation.AllocationType == AllocationKind.Override)
            to = from;

        if (to.HasValue && to < from)
            return new ServiceResponseDto<bool> { Success = false, Message = "Effective to date cannot be before the effective from date." };

        var referenceError = await ValidateReferencesAsync(routeId, busId);
        if (referenceError != null)
            return new ServiceResponseDto<bool> { Success = false, Message = referenceError };

        var clashError = await FindOverlapAsync(id, routeId, busId, allocation.AllocationType, from, to);
        if (clashError != null)
            return new ServiceResponseDto<bool> { Success = false, Message = clashError };

        allocation.RouteId = routeId;
        allocation.BusId = busId;
        allocation.EffectiveFrom = from;
        allocation.EffectiveTo = to;
        if (model.Reason != null) allocation.Reason = model.Reason;
        if (model.IsActive.HasValue) allocation.IsActive = model.IsActive.Value;
        allocation.UpdatedById = _jwtTokenUtility.GetUserId();
        allocation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Allocation updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var allocation = await _context.BusRouteAllocations.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (allocation == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Allocation not found." };

        allocation.IsDeleted = true;
        allocation.IsActive = false;
        allocation.UpdatedById = _jwtTokenUtility.GetUserId();
        allocation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Allocation deleted successfully." };
    }

    // ------------------------------------------------------------------ helpers

    private async Task<string?> ValidateReferencesAsync(int routeId, int busId)
    {
        if (!await _context.RoutesMasters.AnyAsync(r => r.Id == routeId && !r.IsDeleted))
            return "The selected route does not exist.";

        if (!await _context.BusesMasters.AnyAsync(b => b.Id == busId && !b.IsDeleted))
            return "The selected bus does not exist.";

        return null;
    }

    /// <summary>
    /// Date ranges cannot be policed by an index — SQL Server has no exclusion
    /// constraints — so overlapping rows are caught here. The filtered unique indexes
    /// still cover the open-ended standing case and same-date overrides.
    /// </summary>
    private async Task<string?> FindOverlapAsync(
        int? excludeId, int routeId, int busId, string allocationType, DateOnly from, DateOnly? to)
    {
        var sameKind = await _context.BusRouteAllocations
            .Include(a => a.Route)
            .Include(a => a.Bus)
            .Where(a => !a.IsDeleted && a.IsActive
                     && a.AllocationType == allocationType
                     && (a.RouteId == routeId || a.BusId == busId)
                     && (excludeId == null || a.Id != excludeId))
            .ToListAsync();

        foreach (var other in sameKind)
        {
            bool overlaps = from <= (other.EffectiveTo ?? DateOnly.MaxValue)
                         && (to ?? DateOnly.MaxValue) >= other.EffectiveFrom;
            if (!overlaps) continue;

            if (other.RouteId == routeId && other.BusId == busId)
                return $"This bus is already allocated to this route from {other.EffectiveFrom:yyyy-MM-dd}.";

            if (other.RouteId == routeId)
                return $"Route '{other.Route?.RouteName}' already has bus {other.Bus?.BusNumber} " +
                       $"allocated from {other.EffectiveFrom:yyyy-MM-dd}. Close that allocation first.";

            return $"Bus {other.Bus?.BusNumber} is already allocated to route " +
                   $"'{other.Route?.RouteName}' from {other.EffectiveFrom:yyyy-MM-dd}.";
        }

        return null;
    }

    private IQueryable<BusRouteAllocation> BaseQuery() =>
        _context.BusRouteAllocations
            .Include(a => a.Route)
            .Include(a => a.Bus)
            .Where(a => !a.IsDeleted);

    private static BusRouteAllocationListModel MapToListModel(BusRouteAllocation a) => new()
    {
        Id = a.Id,
        RouteId = a.RouteId,
        RouteName = a.Route != null ? a.Route.RouteName : null,
        RouteCode = a.Route != null ? a.Route.RouteCode : null,
        BusId = a.BusId,
        BusNumber = a.Bus != null ? a.Bus.BusNumber : null,
        BusType = a.Bus != null ? a.Bus.BusType : null,
        AllocationType = a.AllocationType,
        EffectiveFrom = a.EffectiveFrom,
        EffectiveTo = a.EffectiveTo,
        Reason = a.Reason,
        IsActive = a.IsActive,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };

    private static ServiceResponseDto<BusRouteAllocationListModel> Fail(string message) =>
        new() { Success = false, Message = message };
}
