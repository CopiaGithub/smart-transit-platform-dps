using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.UserMasterService;

public class UserMasterService : IUserMasterService
{
    private readonly ApplicationDbContext _context;

    public UserMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<UserMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? roleId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.UserMasters
            .Include(u => u.Role)
            .Where(u => !u.IsDeleted)
            .AsQueryable();

        // Default master lists to Active-only; explicit false/status override.
        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(u => u.IsActive == activeFilter.Value);

        if (roleId.HasValue)
            query = query.Where(u => u.RoleId == roleId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(u =>
                u.Name.Contains(term) ||
                (u.EmailId != null && u.EmailId.Contains(term)) ||
                (u.EmployeeCode != null && u.EmployeeCode.Contains(term)) ||
                (u.Contact != null && u.Contact.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "emailid" => filter.Descending ? query.OrderByDescending(u => u.EmailId) : query.OrderBy(u => u.EmailId),
            "employeecode" => filter.Descending ? query.OrderByDescending(u => u.EmployeeCode) : query.OrderBy(u => u.EmployeeCode),
            "createdat" => filter.Descending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(u => u.Name) : query.OrderBy(u => u.Name),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserMasterListModel
            {
                Id = u.Id,
                Name = u.Name,
                Contact = u.Contact,
                EmailId = u.EmailId,
                Address = u.Address,
                EmployeeCode = u.EmployeeCode,
                RoleId = u.RoleId,
                RoleName = u.Role != null ? u.Role.RoleName : null,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<UserMasterListModel>>
        {
            Data = new PagedResult<UserMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Users fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<UserMasterListModel>> GetByIdAsync(int id)
    {
        var user = await _context.UserMasters
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

        if (user == null)
            return new ServiceResponseDto<UserMasterListModel> { Success = false, Message = "User not found." };

        return new ServiceResponseDto<UserMasterListModel> { Data = MapToListModel(user) };
    }

    public async Task<ServiceResponseDto<UserMasterListModel>> CreateAsync(UserMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Name))
            return new ServiceResponseDto<UserMasterListModel> { Success = false, Message = "Name is required." };

        if (!string.IsNullOrWhiteSpace(model.EmailId))
        {
            bool emailExists = await _context.UserMasters
                .AnyAsync(u => u.EmailId == model.EmailId && !u.IsDeleted);
            if (emailExists)
                return new ServiceResponseDto<UserMasterListModel> { Success = false, Message = "A user with this email already exists." };
        }

        var user = new UserMaster
        {
            Name = model.Name.Trim(),
            Contact = model.Contact,
            EmailId = model.EmailId,
            Password = model.Password,
            Address = model.Address,
            EmployeeCode = model.EmployeeCode,
            RoleId = model.RoleId,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = model.CreatedById,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.UserMasters.Add(user);
        await _context.SaveChangesAsync();

        await _context.Entry(user).Reference(u => u.Role).LoadAsync();

        return new ServiceResponseDto<UserMasterListModel>
        {
            Data = MapToListModel(user),
            Message = "User created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, UserMasterUpdateModel model)
    {
        var user = await _context.UserMasters.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "User not found." };

        if (!string.IsNullOrWhiteSpace(model.EmailId) && model.EmailId != user.EmailId)
        {
            bool emailExists = await _context.UserMasters
                .AnyAsync(u => u.EmailId == model.EmailId && u.Id != id && !u.IsDeleted);
            if (emailExists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A user with this email already exists." };
        }

        if (model.Name != null) user.Name = model.Name.Trim();
        if (model.Contact != null) user.Contact = model.Contact;
        if (model.EmailId != null) user.EmailId = model.EmailId;
        if (model.Password != null) user.Password = model.Password;
        if (model.Address != null) user.Address = model.Address;
        if (model.EmployeeCode != null) user.EmployeeCode = model.EmployeeCode;
        if (model.RoleId.HasValue) user.RoleId = model.RoleId;
        if (model.IsActive.HasValue) user.IsActive = model.IsActive.Value;
        user.UpdatedById = model.UpdatedById;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool> { Data = true, Message = "User updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> BulkUpdateStatusAsync(ChangeStatusModel model)
    {
        if (model.Ids == null || model.Ids.Count == 0)
            return new ServiceResponseDto<bool> { Success = false, Message = "No user ids provided." };

        var users = await _context.UserMasters
            .Where(u => model.Ids.Contains(u.Id) && !u.IsDeleted)
            .ToListAsync();

        if (users.Count == 0)
            return new ServiceResponseDto<bool> { Success = false, Message = "No matching users found." };

        foreach (var user in users)
        {
            user.IsActive = model.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool> { Data = true, Message = $"{users.Count} user(s) updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var user = await _context.UserMasters.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        if (user == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "User not found." };

        // Soft delete to preserve referential history.
        user.IsDeleted = true;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ServiceResponseDto<bool> { Data = true, Message = "User deleted successfully." };
    }

    private static UserMasterListModel MapToListModel(UserMaster u) => new()
    {
        Id = u.Id,
        Name = u.Name,
        Contact = u.Contact,
        EmailId = u.EmailId,
        Address = u.Address,
        EmployeeCode = u.EmployeeCode,
        RoleId = u.RoleId,
        RoleName = u.Role?.RoleName,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt,
        UpdatedAt = u.UpdatedAt
    };
}
