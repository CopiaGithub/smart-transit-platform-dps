using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.StudentParentMappingService;

public class StudentParentMappingService : IStudentParentMappingService
{
    /// <summary>Mirrors CK_student_parent_mapping_Relation.</summary>
    private static readonly string[] ValidRelations =
    {
        "Father", "Mother", "Guardian", "Grandfather", "Grandmother",
        "Uncle", "Aunt", "Sibling", "Driver", "Other"
    };

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public StudentParentMappingService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<StudentParentMappingListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? studentId = null, int? parentId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = BaseQuery();

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(m => m.IsActive == activeFilter.Value);

        if (studentId.HasValue) query = query.Where(m => m.StudentId == studentId.Value);
        if (parentId.HasValue) query = query.Where(m => m.ParentId == parentId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(m =>
                m.Student!.FirstName.Contains(term) ||
                m.Student.LastName.Contains(term) ||
                m.Student.AdmissionNumber.Contains(term) ||
                m.Parent!.FirstName.Contains(term) ||
                m.Parent.LastName.Contains(term) ||
                m.Parent.MobileNumber.Contains(term));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "relation" => filter.Descending ? query.OrderByDescending(m => m.Relation) : query.OrderBy(m => m.Relation),
            "createdat" => filter.Descending ? query.OrderByDescending(m => m.CreatedAt) : query.OrderBy(m => m.CreatedAt),
            _ => filter.Descending
                ? query.OrderByDescending(m => m.IsPrimaryContact).ThenByDescending(m => m.ContactPriority)
                : query.OrderByDescending(m => m.IsPrimaryContact).ThenBy(m => m.ContactPriority),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => MapToListModel(m))
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<StudentParentMappingListModel>>
        {
            Data = new PagedResult<StudentParentMappingListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Student-parent links fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<StudentParentMappingListModel>> GetByIdAsync(int id)
    {
        var mapping = await BaseQuery().Where(m => m.Id == id).Select(m => MapToListModel(m)).FirstOrDefaultAsync();
        if (mapping == null)
            return new ServiceResponseDto<StudentParentMappingListModel> { Success = false, Message = "Student-parent link not found." };

        return new ServiceResponseDto<StudentParentMappingListModel> { Data = mapping };
    }

    public async Task<ServiceResponseDto<StudentParentMappingListModel>> CreateAsync(StudentParentMappingCreateModel model)
    {
        if (!ValidRelations.Contains(model.Relation))
            return Fail($"Relation must be one of: {string.Join(", ", ValidRelations)}.");

        if (!await _context.StudentMasters.AnyAsync(s => s.Id == model.StudentId && !s.IsDeleted))
            return Fail("The selected student does not exist.");

        if (!await _context.ParentMasters.AnyAsync(p => p.Id == model.ParentId && !p.IsDeleted))
            return Fail("The selected parent does not exist.");

        bool exists = await _context.StudentParentMappings
            .AnyAsync(m => m.StudentId == model.StudentId && m.ParentId == model.ParentId && !m.IsDeleted);
        if (exists)
            return Fail("This parent is already linked to this student.");

        var currentUserId = _jwtTokenUtility.GetUserId();
        bool isPrimary = model.IsPrimaryContact ?? false;

        // A student may have only one primary contact, so demote the incumbent before
        // inserting, otherwise UX_student_parent_mapping_OnePrimary rejects the write.
        if (isPrimary)
            await DemoteExistingPrimaryAsync(model.StudentId, null, currentUserId);

        var mapping = new StudentParentMapping
        {
            StudentId = model.StudentId,
            ParentId = model.ParentId,
            Relation = model.Relation,
            IsPrimaryContact = isPrimary,
            IsEmergencyContact = model.IsEmergencyContact ?? false,
            IsAuthorisedForPickup = model.IsAuthorisedForPickup ?? true,
            ReceivesNotifications = model.ReceivesNotifications ?? true,
            ContactPriority = model.ContactPriority is > 0 ? model.ContactPriority.Value : (isPrimary ? 1 : 2),
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.StudentParentMappings.Add(mapping);
        await _context.SaveChangesAsync();

        var saved = await BaseQuery().Where(m => m.Id == mapping.Id).Select(m => MapToListModel(m)).FirstAsync();
        return new ServiceResponseDto<StudentParentMappingListModel>
        {
            Data = saved,
            Message = "Parent linked to student successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, StudentParentMappingUpdateModel model)
    {
        var mapping = await _context.StudentParentMappings.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (mapping == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Student-parent link not found." };

        if (model.Relation != null)
        {
            if (!ValidRelations.Contains(model.Relation))
                return new ServiceResponseDto<bool> { Success = false, Message = $"Relation must be one of: {string.Join(", ", ValidRelations)}." };

            mapping.Relation = model.Relation;
        }

        var currentUserId = _jwtTokenUtility.GetUserId();

        if (model.IsPrimaryContact.HasValue && model.IsPrimaryContact.Value && !mapping.IsPrimaryContact)
        {
            await DemoteExistingPrimaryAsync(mapping.StudentId, id, currentUserId);
            mapping.IsPrimaryContact = true;
        }
        else if (model.IsPrimaryContact.HasValue)
        {
            mapping.IsPrimaryContact = model.IsPrimaryContact.Value;
        }

        if (model.IsEmergencyContact.HasValue) mapping.IsEmergencyContact = model.IsEmergencyContact.Value;
        if (model.IsAuthorisedForPickup.HasValue) mapping.IsAuthorisedForPickup = model.IsAuthorisedForPickup.Value;
        if (model.ReceivesNotifications.HasValue) mapping.ReceivesNotifications = model.ReceivesNotifications.Value;
        if (model.ContactPriority is > 0) mapping.ContactPriority = model.ContactPriority.Value;
        if (model.IsActive.HasValue) mapping.IsActive = model.IsActive.Value;
        mapping.UpdatedById = currentUserId;
        mapping.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Student-parent link updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var mapping = await _context.StudentParentMappings.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (mapping == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Student-parent link not found." };

        mapping.IsDeleted = true;
        mapping.IsActive = false;
        mapping.IsPrimaryContact = false;
        mapping.UpdatedById = _jwtTokenUtility.GetUserId();
        mapping.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Student-parent link removed successfully." };
    }

    private async Task DemoteExistingPrimaryAsync(int studentId, int? exceptId, int? currentUserId)
    {
        var existing = await _context.StudentParentMappings
            .Where(m => m.StudentId == studentId && m.IsPrimaryContact && !m.IsDeleted
                     && (exceptId == null || m.Id != exceptId))
            .ToListAsync();

        foreach (var item in existing)
        {
            item.IsPrimaryContact = false;
            item.UpdatedById = currentUserId;
            item.UpdatedAt = DateTime.UtcNow;
        }

        if (existing.Count > 0)
            await _context.SaveChangesAsync();
    }

    private IQueryable<StudentParentMapping> BaseQuery() =>
        _context.StudentParentMappings
            .Include(m => m.Student)
            .Include(m => m.Parent)
            .Where(m => !m.IsDeleted && m.Student != null && !m.Student.IsDeleted
                     && m.Parent != null && !m.Parent.IsDeleted);

    private static StudentParentMappingListModel MapToListModel(StudentParentMapping m) => new()
    {
        Id = m.Id,
        StudentId = m.StudentId,
        StudentName = m.Student!.FirstName + " " + m.Student.LastName,
        AdmissionNumber = m.Student.AdmissionNumber,
        Class = m.Student.Grade + "-" + m.Student.Division,
        ParentId = m.ParentId,
        ParentName = m.Parent!.FirstName + " " + m.Parent.LastName,
        MobileNumber = m.Parent.MobileNumber,
        Relation = m.Relation,
        IsPrimaryContact = m.IsPrimaryContact,
        IsEmergencyContact = m.IsEmergencyContact,
        IsAuthorisedForPickup = m.IsAuthorisedForPickup,
        ReceivesNotifications = m.ReceivesNotifications,
        ContactPriority = m.ContactPriority,
        IsActive = m.IsActive,
        CreatedAt = m.CreatedAt,
        UpdatedAt = m.UpdatedAt
    };

    private static ServiceResponseDto<StudentParentMappingListModel> Fail(string message) =>
        new() { Success = false, Message = message };
}
