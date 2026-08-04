using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.StudentParentMappingService;

public interface IStudentParentMappingService
{
    Task<ServiceResponseDto<PagedResult<StudentParentMappingListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? studentId = null, int? parentId = null, bool? status = null);

    Task<ServiceResponseDto<StudentParentMappingListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<StudentParentMappingListModel>> CreateAsync(StudentParentMappingCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, StudentParentMappingUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
