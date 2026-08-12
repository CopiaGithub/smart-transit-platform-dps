using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.AcademicYearMasterService;

public class AcademicYearMasterService : IAcademicYearMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public AcademicYearMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<AcademicYearMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.AcademicYearMasters.Where(a => !a.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(a => a.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(a => a.YearName.Contains(term));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "yearname" => filter.Descending ? query.OrderByDescending(a => a.YearName) : query.OrderBy(a => a.YearName),
            "createdat" => filter.Descending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(a => a.StartDate) : query.OrderBy(a => a.StartDate),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AcademicYearMasterListModel
            {
                Id = a.Id,
                YearName = a.YearName,
                StartDate = a.StartDate,
                EndDate = a.EndDate,
                IsCurrent = a.IsCurrent,
                StudentCount = a.Students.Count(s => !s.IsDeleted),
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<AcademicYearMasterListModel>>
        {
            Data = new PagedResult<AcademicYearMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Academic years fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<AcademicYearMasterListModel>> GetByIdAsync(int id)
    {
        var year = await _context.AcademicYearMasters.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (year == null)
            return new ServiceResponseDto<AcademicYearMasterListModel> { Success = false, Message = "Academic year not found." };

        return new ServiceResponseDto<AcademicYearMasterListModel> { Data = await MapToListModelAsync(year) };
    }

    public async Task<ServiceResponseDto<AcademicYearMasterListModel>> GetCurrentAsync()
    {
        var year = await _context.AcademicYearMasters.FirstOrDefaultAsync(a => a.IsCurrent && !a.IsDeleted);
        if (year == null)
            return new ServiceResponseDto<AcademicYearMasterListModel> { Success = false, Message = "No current academic year is set." };

        return new ServiceResponseDto<AcademicYearMasterListModel> { Data = await MapToListModelAsync(year) };
    }

    public async Task<ServiceResponseDto<AcademicYearMasterListModel>> CreateAsync(AcademicYearMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.YearName))
            return new ServiceResponseDto<AcademicYearMasterListModel> { Success = false, Message = "Year name is required." };

        if (model.EndDate <= model.StartDate)
            return new ServiceResponseDto<AcademicYearMasterListModel> { Success = false, Message = "End date must be after the start date." };

        var yearName = model.YearName.Trim();
        bool exists = await _context.AcademicYearMasters.AnyAsync(a => a.YearName == yearName && !a.IsDeleted);
        if (exists)
            return new ServiceResponseDto<AcademicYearMasterListModel> { Success = false, Message = "An academic year with this name already exists." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var year = new AcademicYearMaster
        {
            YearName = yearName,
            StartDate = model.StartDate,
            EndDate = model.EndDate,
            IsCurrent = model.IsCurrent ?? false,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Only one year may be current — clear the previous holder first, or the
        // filtered unique index rejects the insert.
        if (year.IsCurrent)
            await ClearCurrentFlagAsync(null);

        _context.AcademicYearMasters.Add(year);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<AcademicYearMasterListModel>
        {
            Data = await MapToListModelAsync(year),
            Message = "Academic year created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, AcademicYearMasterUpdateModel model)
    {
        var year = await _context.AcademicYearMasters.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (year == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Academic year not found." };

        if (!string.IsNullOrWhiteSpace(model.YearName) && model.YearName.Trim() != year.YearName)
        {
            var yearName = model.YearName.Trim();
            bool exists = await _context.AcademicYearMasters.AnyAsync(a => a.YearName == yearName && a.Id != id && !a.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "An academic year with this name already exists." };

            year.YearName = yearName;
        }

        var start = model.StartDate ?? year.StartDate;
        var end = model.EndDate ?? year.EndDate;
        if (end <= start)
            return new ServiceResponseDto<bool> { Success = false, Message = "End date must be after the start date." };

        year.StartDate = start;
        year.EndDate = end;

        if (model.IsCurrent.HasValue && model.IsCurrent.Value && !year.IsCurrent)
        {
            await ClearCurrentFlagAsync(id);
            year.IsCurrent = true;
        }
        else if (model.IsCurrent.HasValue)
        {
            year.IsCurrent = model.IsCurrent.Value;
        }

        if (model.IsActive.HasValue) year.IsActive = model.IsActive.Value;
        year.UpdatedById = _jwtTokenUtility.GetUserId();
        year.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Academic year updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var year = await _context.AcademicYearMasters.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (year == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Academic year not found." };

        bool hasStudents = await _context.StudentMasters.AnyAsync(s => s.AcademicYearId == id && !s.IsDeleted);
        if (hasStudents)
            return new ServiceResponseDto<bool> { Success = false, Message = "This academic year has students assigned and cannot be deleted." };

        year.IsDeleted = true;
        year.IsActive = false;
        year.IsCurrent = false;
        year.UpdatedById = _jwtTokenUtility.GetUserId();
        year.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Academic year deleted successfully." };
    }

    private async Task ClearCurrentFlagAsync(int? exceptId)
    {
        var current = await _context.AcademicYearMasters
            .Where(a => a.IsCurrent && !a.IsDeleted && (exceptId == null || a.Id != exceptId))
            .ToListAsync();

        foreach (var item in current)
        {
            item.IsCurrent = false;
            item.UpdatedAt = DateTime.UtcNow;
        }

        if (current.Count > 0)
            await _context.SaveChangesAsync();
    }

    private async Task<AcademicYearMasterListModel> MapToListModelAsync(AcademicYearMaster a) => new()
    {
        Id = a.Id,
        YearName = a.YearName,
        StartDate = a.StartDate,
        EndDate = a.EndDate,
        IsCurrent = a.IsCurrent,
        StudentCount = await _context.StudentMasters.CountAsync(s => s.AcademicYearId == a.Id && !s.IsDeleted),
        IsActive = a.IsActive,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}
