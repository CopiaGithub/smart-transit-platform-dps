using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.CityMasterService;

public interface ICityMasterService
{
    Task<ServiceResponseDto<PagedResult<CityMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? stateId = null, int? regionId = null, bool? status = null);
}
