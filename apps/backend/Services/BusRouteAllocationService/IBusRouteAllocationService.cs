using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.BusRouteAllocationService;

public interface IBusRouteAllocationService
{
    Task<ServiceResponseDto<PagedResult<BusRouteAllocationListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? routeId = null, int? busId = null,
        string? allocationType = null, bool? status = null);

    Task<ServiceResponseDto<BusRouteAllocationListModel>> GetByIdAsync(int id);

    /// <summary>Every route-to-bus pairing in force on a date, overrides applied.</summary>
    Task<ServiceResponseDto<List<ResolvedAllocationModel>>> GetForDateAsync(DateOnly date);

    /// <summary>The route a given bus is running on a date, or null.</summary>
    Task<int?> ResolveRouteForBusAsync(int busId, DateOnly date);

    /// <summary>The bus running a given route on a date, or null.</summary>
    Task<int?> ResolveBusForRouteAsync(int routeId, DateOnly date);

    /// <summary>
    /// The bus running each of these routes on a date, keyed by route. Routes with
    /// no allocation in force are absent. One query for the whole set, so a page of
    /// students does not turn into a resolve call per row.
    /// </summary>
    Task<Dictionary<int, int>> ResolveBusesForRoutesAsync(IReadOnlyCollection<int> routeIds, DateOnly date);

    /// <summary>
    /// Every route a bus is running on a date. The inverse of
    /// <see cref="ResolveBusesForRoutesAsync"/>, and it honours overrides both ways:
    /// a route whose override moved it to another bus is not this bus's route.
    /// </summary>
    Task<List<int>> ResolveRoutesForBusAsync(int busId, DateOnly date);

    Task<ServiceResponseDto<BusRouteAllocationListModel>> CreateAsync(BusRouteAllocationCreateModel model);
    Task<ServiceResponseDto<BusRouteAllocationListModel>> SubstituteAsync(SubstituteBusModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, BusRouteAllocationUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
