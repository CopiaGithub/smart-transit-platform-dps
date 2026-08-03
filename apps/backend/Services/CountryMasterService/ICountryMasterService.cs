using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.CountryMasterService;

public interface ICountryMasterService
{
    Task<ServiceResponseDto<PagedResult<CountryMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
}
