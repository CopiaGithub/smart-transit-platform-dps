using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.AcademicYearMasterService;

public interface IAcademicYearMasterService
{
    Task<ServiceResponseDto<PagedResult<AcademicYearMasterListModel>>> GetAllAsync(PaginationFilterDto filter, bool? status = null);
    Task<ServiceResponseDto<AcademicYearMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<AcademicYearMasterListModel>> GetCurrentAsync();
    Task<ServiceResponseDto<AcademicYearMasterListModel>> CreateAsync(AcademicYearMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, AcademicYearMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
