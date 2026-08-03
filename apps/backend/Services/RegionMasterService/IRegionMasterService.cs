using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.RegionMasterService;

public interface IRegionMasterService
{
    Task<ServiceResponseDto<PagedResult<RegionMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? countryId = null, bool? status = null);
}
