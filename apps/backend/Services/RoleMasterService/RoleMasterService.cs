using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.RoleMasterService;

public class RoleMasterService : IRoleMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public RoleMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<RoleMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.RoleMasters.Where(r => !r.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(r => r.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(r =>
                r.RoleName.Contains(term) ||
                (r.Description != null && r.Description.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "createdat" => filter.Descending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(r => r.RoleName) : query.OrderBy(r => r.RoleName),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoleMasterListModel
            {
                Id = r.Id,
                RoleName = r.RoleName,
                Description = r.Description,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<RoleMasterListModel>>
        {
            Data = new PagedResult<RoleMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Roles fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<RoleMasterListModel>> GetByIdAsync(int id)
    {
        var role = await _context.RoleMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (role == null)
            return new ServiceResponseDto<RoleMasterListModel> { Success = false, Message = "Role not found." };

        return new ServiceResponseDto<RoleMasterListModel> { Data = MapToListModel(role) };
    }

    public async Task<ServiceResponseDto<RoleMasterListModel>> CreateAsync(RoleMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.RoleName))
            return new ServiceResponseDto<RoleMasterListModel> { Success = false, Message = "Role name is required." };

        bool exists = await _context.RoleMasters
            .AnyAsync(r => r.RoleName == model.RoleName.Trim() && !r.IsDeleted);
        if (exists)
            return new ServiceResponseDto<RoleMasterListModel> { Success = false, Message = "A role with this name already exists." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var role = new RoleMaster
        {
            RoleName = model.RoleName.Trim(),
            Description = model.Description,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.RoleMasters.Add(role);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<RoleMasterListModel>
        {
            Data = MapToListModel(role),
            Message = "Role created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, RoleMasterUpdateModel model)
    {
        var role = await _context.RoleMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (role == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Role not found." };

        if (!string.IsNullOrWhiteSpace(model.RoleName) && model.RoleName.Trim() != role.RoleName)
        {
            // The five seeded role names are load-bearing, not labels. Thirty-one
            // endpoints authorise on the literal string through RoleNames, the web
            // sidebar decides what to show by matching it, and the gate consoles
            // find "Gate 6" / "Gate 1" inside it to know which post a guard is on.
            //
            // Renaming one does not migrate any of that: it silently locks every
            // holder of that role out of the endpoints it names, which reads to a
            // user like "all my mappings were reset". Nothing in the row is worth
            // that, so the rename is refused rather than warned about.
            if (RoleNames.IsSystemRole(role.RoleName))
            {
                return new ServiceResponseDto<bool>
                {
                    Success = false,
                    Message =
                        $"\"{role.RoleName}\" is a built-in role and cannot be renamed. " +
                        "Permissions across the apps are matched on this exact name, so " +
                        "renaming it would remove access for everyone who holds it. " +
                        "Change the description instead, or create a new role."
                };
            }

            bool exists = await _context.RoleMasters
                .AnyAsync(r => r.RoleName == model.RoleName.Trim() && r.Id != id && !r.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A role with this name already exists." };
        }

        if (model.RoleName != null) role.RoleName = model.RoleName.Trim();
        if (model.Description != null) role.Description = model.Description;
        if (model.IsActive.HasValue) role.IsActive = model.IsActive.Value;
        role.UpdatedById = _jwtTokenUtility.GetUserId();
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Role updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var role = await _context.RoleMasters.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (role == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Role not found." };

        role.IsDeleted = true;
        role.IsActive = false;
        role.UpdatedById = _jwtTokenUtility.GetUserId();
        role.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Role deleted successfully." };
    }

    private static RoleMasterListModel MapToListModel(RoleMaster r) => new()
    {
        Id = r.Id,
        RoleName = r.RoleName,
        Description = r.Description,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt
    };
}
