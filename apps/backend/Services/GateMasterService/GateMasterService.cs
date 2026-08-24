using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.GateMasterService;

public class GateMasterService : IGateMasterService
{
    /// <summary>Mirrors CK_gate_master_GateType — reject here so the user gets a message, not a 500.</summary>
    private static readonly string[] ValidGateTypes = { "BusEntry", "BusExit", "StudentExit" };

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public GateMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<GateMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, string? gateType = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.GateMasters.Where(g => !g.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(g => g.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(gateType))
            query = query.Where(g => g.GateType == gateType);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(g => g.GateCode.Contains(term) || g.GateName.Contains(term));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "gatecode" => filter.Descending ? query.OrderByDescending(g => g.GateCode) : query.OrderBy(g => g.GateCode),
            "gatename" => filter.Descending ? query.OrderByDescending(g => g.GateName) : query.OrderBy(g => g.GateName),
            "createdat" => filter.Descending ? query.OrderByDescending(g => g.CreatedAt) : query.OrderBy(g => g.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(g => g.SortOrder) : query.OrderBy(g => g.SortOrder),
        };

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GateMasterListModel
            {
                Id = g.Id,
                GateCode = g.GateCode,
                GateName = g.GateName,
                GateType = g.GateType,
                SortOrder = g.SortOrder,
                DisplayCount = g.Displays.Count(d => !d.IsDeleted),
                PlatformCount = g.Platforms.Count(p => !p.IsDeleted),
                IsActive = g.IsActive,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<GateMasterListModel>>
        {
            Data = new PagedResult<GateMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Gates fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<GateMasterListModel>> GetByIdAsync(int id)
    {
        var gate = await _context.GateMasters.FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);
        if (gate == null)
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = "Gate not found." };

        return new ServiceResponseDto<GateMasterListModel> { Data = await MapToListModelAsync(gate) };
    }

    public async Task<ServiceResponseDto<GateMasterListModel>> CreateAsync(GateMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.GateCode))
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = "Gate code is required." };

        if (string.IsNullOrWhiteSpace(model.GateName))
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = "Gate name is required." };

        if (!ValidGateTypes.Contains(model.GateType))
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = $"Gate type must be one of: {string.Join(", ", ValidGateTypes)}." };

        var code = model.GateCode.Trim();
        bool exists = await _context.GateMasters.AnyAsync(g => g.GateCode == code && !g.IsDeleted);
        if (exists)
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = "A gate with this code already exists." };

        // Sort order decides the order gates appear in, so two gates sharing one
        // leaves that order down to whatever the database happens to return.
        if (await SortOrderTakenAsync(model.SortOrder, null))
            return new ServiceResponseDto<GateMasterListModel> { Success = false, Message = $"Sort order {model.SortOrder} is already used by another gate." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var gate = new GateMaster
        {
            GateCode = code,
            GateName = model.GateName.Trim(),
            GateType = model.GateType,
            SortOrder = model.SortOrder,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GateMasters.Add(gate);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<GateMasterListModel>
        {
            Data = await MapToListModelAsync(gate),
            Message = "Gate created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, GateMasterUpdateModel model)
    {
        var gate = await _context.GateMasters.FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);
        if (gate == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Gate not found." };

        if (!string.IsNullOrWhiteSpace(model.GateCode) && model.GateCode.Trim() != gate.GateCode)
        {
            var code = model.GateCode.Trim();
            bool exists = await _context.GateMasters.AnyAsync(g => g.GateCode == code && g.Id != id && !g.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A gate with this code already exists." };

            gate.GateCode = code;
        }

        if (model.GateType != null)
        {
            if (!ValidGateTypes.Contains(model.GateType))
                return new ServiceResponseDto<bool> { Success = false, Message = $"Gate type must be one of: {string.Join(", ", ValidGateTypes)}." };

            gate.GateType = model.GateType;
        }

        if (model.SortOrder.HasValue && model.SortOrder.Value != gate.SortOrder)
        {
            if (await SortOrderTakenAsync(model.SortOrder.Value, id))
                return new ServiceResponseDto<bool> { Success = false, Message = $"Sort order {model.SortOrder.Value} is already used by another gate." };
        }

        if (model.GateName != null) gate.GateName = model.GateName.Trim();
        if (model.SortOrder.HasValue) gate.SortOrder = model.SortOrder.Value;
        if (model.IsActive.HasValue) gate.IsActive = model.IsActive.Value;
        gate.UpdatedById = _jwtTokenUtility.GetUserId();
        gate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Gate updated successfully." };
    }

    /// <summary>
    /// Is this sort order already on another gate?
    ///
    /// <paramref name="exceptId"/> is the row being edited, which must not count
    /// against itself — saving a gate without touching its sort order has to keep
    /// working. Soft-deleted rows are ignored: they are invisible everywhere else,
    /// so letting one reserve a number would block a value for no visible reason.
    /// </summary>
    private async Task<bool> SortOrderTakenAsync(int sortOrder, int? exceptId)
    {
        return await _context.GateMasters.AnyAsync(g =>
            g.SortOrder == sortOrder &&
            !g.IsDeleted &&
            (exceptId == null || g.Id != exceptId));
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var gate = await _context.GateMasters.FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted);
        if (gate == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Gate not found." };

        bool inUse = await _context.DisplayMasters.AnyAsync(d => (d.GateId == id || d.FilterByGateId == id) && !d.IsDeleted)
                  || await _context.PlatformsMasters.AnyAsync(p => p.NearestGateId == id && !p.IsDeleted)
                  || await _context.StudentMasters.AnyAsync(s => s.ExitGateId == id && !s.IsDeleted);
        if (inUse)
            return new ServiceResponseDto<bool> { Success = false, Message = "This gate is referenced by displays, platforms or students and cannot be deleted." };

        gate.IsDeleted = true;
        gate.IsActive = false;
        gate.UpdatedById = _jwtTokenUtility.GetUserId();
        gate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Gate deleted successfully." };
    }

    private async Task<GateMasterListModel> MapToListModelAsync(GateMaster g) => new()
    {
        Id = g.Id,
        GateCode = g.GateCode,
        GateName = g.GateName,
        GateType = g.GateType,
        SortOrder = g.SortOrder,
        DisplayCount = await _context.DisplayMasters.CountAsync(d => d.GateId == g.Id && !d.IsDeleted),
        PlatformCount = await _context.PlatformsMasters.CountAsync(p => p.NearestGateId == g.Id && !p.IsDeleted),
        IsActive = g.IsActive,
        CreatedAt = g.CreatedAt,
        UpdatedAt = g.UpdatedAt
    };
}
