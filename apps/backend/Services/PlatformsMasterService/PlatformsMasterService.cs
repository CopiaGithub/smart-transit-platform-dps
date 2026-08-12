using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.PlatformsMasterService;

public class PlatformsMasterService : IPlatformsMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public PlatformsMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<PlatformsMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.PlatformsMasters.Where(p => !p.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(p => p.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(p =>
                p.PlatformNumber.ToString().Contains(term) ||
                (p.PlatformName != null && p.PlatformName.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "platformname" => filter.Descending ? query.OrderByDescending(p => p.PlatformName) : query.OrderBy(p => p.PlatformName),
            "createdat" => filter.Descending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(p => p.SortOrder).ThenByDescending(p => p.PlatformNumber)
                                   : query.OrderBy(p => p.SortOrder).ThenBy(p => p.PlatformNumber),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PlatformsMasterListModel
            {
                Id = p.Id,
                PlatformNumber = p.PlatformNumber,
                PlatformName = p.PlatformName,
                SortOrder = p.SortOrder,
                Side = p.Side,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<PlatformsMasterListModel>>
        {
            Data = new PagedResult<PlatformsMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Platforms fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<PlatformsMasterListModel>> GetByIdAsync(int id)
    {
        var platform = await _context.PlatformsMasters.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (platform == null)
            return new ServiceResponseDto<PlatformsMasterListModel> { Success = false, Message = "Platform not found." };

        return new ServiceResponseDto<PlatformsMasterListModel> { Data = MapToListModel(platform) };
    }

    public async Task<ServiceResponseDto<PlatformsMasterListModel>> CreateAsync(PlatformsMasterCreateModel model)
    {
        if (model.PlatformNumber <= 0)
            return new ServiceResponseDto<PlatformsMasterListModel> { Success = false, Message = "Platform number must be greater than zero." };

        bool exists = await _context.PlatformsMasters
            .AnyAsync(p => p.PlatformNumber == model.PlatformNumber && !p.IsDeleted);
        if (exists)
            return new ServiceResponseDto<PlatformsMasterListModel> { Success = false, Message = "A platform with this number already exists." };

        var side = NormalizeSide(model.Side);
        if (side != null && side != "Left" && side != "Right")
            return new ServiceResponseDto<PlatformsMasterListModel> { Success = false, Message = "Side must be 'Left' or 'Right'." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var platform = new PlatformsMaster
        {
            PlatformNumber = model.PlatformNumber,
            PlatformName = model.PlatformName,
            SortOrder = model.SortOrder > 0 ? model.SortOrder : model.PlatformNumber,
            Side = side,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PlatformsMasters.Add(platform);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<PlatformsMasterListModel>
        {
            Data = MapToListModel(platform),
            Message = "Platform created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, PlatformsMasterUpdateModel model)
    {
        var platform = await _context.PlatformsMasters.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (platform == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Platform not found." };

        if (model.PlatformNumber.HasValue && model.PlatformNumber.Value != platform.PlatformNumber)
        {
            if (model.PlatformNumber.Value <= 0)
                return new ServiceResponseDto<bool> { Success = false, Message = "Platform number must be greater than zero." };

            bool exists = await _context.PlatformsMasters
                .AnyAsync(p => p.PlatformNumber == model.PlatformNumber.Value && p.Id != id && !p.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A platform with this number already exists." };
        }

        if (model.Side != null)
        {
            var side = NormalizeSide(model.Side);
            if (side != null && side != "Left" && side != "Right")
                return new ServiceResponseDto<bool> { Success = false, Message = "Side must be 'Left' or 'Right'." };
            platform.Side = side;
        }

        if (model.PlatformNumber.HasValue) platform.PlatformNumber = model.PlatformNumber.Value;
        if (model.PlatformName != null) platform.PlatformName = model.PlatformName;
        if (model.SortOrder.HasValue) platform.SortOrder = model.SortOrder.Value;
        if (model.IsActive.HasValue) platform.IsActive = model.IsActive.Value;
        platform.UpdatedById = _jwtTokenUtility.GetUserId();
        platform.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Platform updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var platform = await _context.PlatformsMasters.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (platform == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Platform not found." };

        platform.IsDeleted = true;
        platform.IsActive = false;
        platform.UpdatedById = _jwtTokenUtility.GetUserId();
        platform.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Platform deleted successfully." };
    }

    private static PlatformsMasterListModel MapToListModel(PlatformsMaster p) => new()
    {
        Id = p.Id,
        PlatformNumber = p.PlatformNumber,
        PlatformName = p.PlatformName,
        SortOrder = p.SortOrder,
        Side = p.Side,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    private static string? NormalizeSide(string? side)
    {
        if (string.IsNullOrWhiteSpace(side)) return null;
        return side.Trim().ToLowerInvariant() switch
        {
            "left" or "l" => "Left",
            "right" or "r" => "Right",
            _ => side.Trim()
        };
    }
}
