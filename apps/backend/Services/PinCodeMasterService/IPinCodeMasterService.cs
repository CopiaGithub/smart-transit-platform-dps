using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.PinCodeMasterService;

public interface IPinCodeMasterService
{
    Task<ServiceResponseDto<PagedResult<PinCodeMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? cityId = null, bool? status = null);
}
