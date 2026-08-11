using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.StudentMasterService;

public interface IStudentMasterService
{
    Task<ServiceResponseDto<PagedResult<StudentMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter,
        int? academicYearId = null,
        string? grade = null,
        string? division = null,
        int? busId = null,
        int? exitGateId = null,
        bool? status = null,
        int? classTeacherId = null);

    Task<ServiceResponseDto<StudentMasterListModel>> GetByIdAsync(int id);
    Task<ServiceResponseDto<StudentMasterListModel>> GetByRfidTagAsync(string rfidTag);
    Task<ServiceResponseDto<List<StudentParentModel>>> GetParentsAsync(int id);
    Task<ServiceResponseDto<StudentMasterListModel>> CreateAsync(StudentMasterCreateModel model);
    Task<ServiceResponseDto<bool>> UpdateAsync(int id, StudentMasterUpdateModel model);
    Task<ServiceResponseDto<bool>> DeleteAsync(int id);
}
