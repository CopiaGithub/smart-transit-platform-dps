using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.StateMasterService;

public interface IStateMasterService
{
    Task<ServiceResponseDto<PagedResult<StateMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? countryId = null, int? regionId = null, bool? status = null);
}
