using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.DisplayMasterService;

public class DisplayMasterService : IDisplayMasterService
{
    /// <summary>Mirrors CK_display_master_DisplayType.</summary>
    private static readonly string[] ValidDisplayTypes = { "Outdoor", "Indoor" };

    /// <summary>A panel is considered offline once it misses this much heartbeat time.</summary>
    private static readonly TimeSpan HeartbeatGrace = TimeSpan.FromMinutes(2);

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public DisplayMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<DisplayMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, string? displayType = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.DisplayMasters
            .Include(d => d.Gate)
            .Include(d => d.FilterByGate)
            .Where(d => !d.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(d => d.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(displayType))
            query = query.Where(d => d.DisplayType == displayType);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(d =>
                d.DisplayCode.Contains(term) ||
                d.DisplayName.Contains(term) ||
                (d.Location != null && d.Location.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "displayname" => filter.Descending ? query.OrderByDescending(d => d.DisplayName) : query.OrderBy(d => d.DisplayName),
            "displaytype" => filter.Descending ? query.OrderByDescending(d => d.DisplayType) : query.OrderBy(d => d.DisplayType),
            "createdat" => filter.Descending ? query.OrderByDescending(d => d.CreatedAt) : query.OrderBy(d => d.CreatedAt),
            _ => filter.Descending ? query.OrderByDescending(d => d.DisplayCode) : query.OrderBy(d => d.DisplayCode),
        };

        var entities = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = entities.Select(MapToListModel).ToList();

        return new ServiceResponseDto<PagedResult<DisplayMasterListModel>>
        {
            Data = new PagedResult<DisplayMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Displays fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<DisplayMasterListModel>> GetByIdAsync(int id)
    {
        var display = await _context.DisplayMasters
            .Include(d => d.Gate)
            .Include(d => d.FilterByGate)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);

        if (display == null)
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = "Display not found." };

        return new ServiceResponseDto<DisplayMasterListModel> { Data = MapToListModel(display) };
    }

    public async Task<ServiceResponseDto<DisplayMasterListModel>> CreateAsync(DisplayMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.DisplayCode))
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = "Display code is required." };

        if (string.IsNullOrWhiteSpace(model.DisplayName))
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = "Display name is required." };

        if (!ValidDisplayTypes.Contains(model.DisplayType))
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = $"Display type must be one of: {string.Join(", ", ValidDisplayTypes)}." };

        var code = model.DisplayCode.Trim();
        bool exists = await _context.DisplayMasters.AnyAsync(d => d.DisplayCode == code && !d.IsDeleted);
        if (exists)
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = "A display with this code already exists." };

        var gateError = await ValidateGatesAsync(model.GateId, model.FilterByGateId);
        if (gateError != null)
            return new ServiceResponseDto<DisplayMasterListModel> { Success = false, Message = gateError };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var display = new DisplayMaster
        {
            DisplayCode = code,
            DisplayName = model.DisplayName.Trim(),
            DisplayType = model.DisplayType,
            GateId = model.GateId,
            Location = model.Location,
            IpAddress = model.IpAddress,
            ScreenSize = model.ScreenSize,
            WidthPx = model.WidthPx,
            HeightPx = model.HeightPx,
            VisibleRowCount = model.VisibleRowCount is > 0 ? model.VisibleRowCount.Value : 10,
            FilterByGateId = model.FilterByGateId,
            ConnectionStatus = "Unknown",
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DisplayMasters.Add(display);
        await _context.SaveChangesAsync();

        await _context.Entry(display).Reference(d => d.Gate).LoadAsync();
        await _context.Entry(display).Reference(d => d.FilterByGate).LoadAsync();

        return new ServiceResponseDto<DisplayMasterListModel>
        {
            Data = MapToListModel(display),
            Message = "Display created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, DisplayMasterUpdateModel model)
    {
        var display = await _context.DisplayMasters.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
        if (display == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Display not found." };

        if (!string.IsNullOrWhiteSpace(model.DisplayCode) && model.DisplayCode.Trim() != display.DisplayCode)
        {
            var code = model.DisplayCode.Trim();
            bool exists = await _context.DisplayMasters.AnyAsync(d => d.DisplayCode == code && d.Id != id && !d.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A display with this code already exists." };

            display.DisplayCode = code;
        }

        if (model.DisplayType != null)
        {
            if (!ValidDisplayTypes.Contains(model.DisplayType))
                return new ServiceResponseDto<bool> { Success = false, Message = $"Display type must be one of: {string.Join(", ", ValidDisplayTypes)}." };

            display.DisplayType = model.DisplayType;
        }

        var gateError = await ValidateGatesAsync(model.GateId, model.FilterByGateId);
        if (gateError != null)
            return new ServiceResponseDto<bool> { Success = false, Message = gateError };

        if (model.DisplayName != null) display.DisplayName = model.DisplayName.Trim();
        if (model.GateId.HasValue) display.GateId = model.GateId;
        if (model.Location != null) display.Location = model.Location;
        if (model.IpAddress != null) display.IpAddress = model.IpAddress;
        if (model.ScreenSize != null) display.ScreenSize = model.ScreenSize;
        if (model.WidthPx.HasValue) display.WidthPx = model.WidthPx;
        if (model.HeightPx.HasValue) display.HeightPx = model.HeightPx;
        if (model.VisibleRowCount is > 0) display.VisibleRowCount = model.VisibleRowCount.Value;
        if (model.FilterByGateId.HasValue) display.FilterByGateId = model.FilterByGateId;
        if (model.IsActive.HasValue) display.IsActive = model.IsActive.Value;
        display.UpdatedById = _jwtTokenUtility.GetUserId();
        display.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Display updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var display = await _context.DisplayMasters.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
        if (display == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Display not found." };

        display.IsDeleted = true;
        display.IsActive = false;
        display.UpdatedById = _jwtTokenUtility.GetUserId();
        display.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Display deleted successfully." };
    }

    public async Task<ServiceResponseDto<bool>> RecordHeartbeatAsync(string displayCode)
    {
        var display = await _context.DisplayMasters
            .FirstOrDefaultAsync(d => d.DisplayCode == displayCode && !d.IsDeleted);

        if (display == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Display not found." };

        display.LastHeartbeatAt = DateTime.UtcNow;
        display.ConnectionStatus = "Online";
        display.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Heartbeat recorded." };
    }

    private async Task<string?> ValidateGatesAsync(int? gateId, int? filterByGateId)
    {
        if (gateId.HasValue && !await _context.GateMasters.AnyAsync(g => g.Id == gateId && !g.IsDeleted))
            return "The selected gate does not exist.";

        if (filterByGateId.HasValue && !await _context.GateMasters.AnyAsync(g => g.Id == filterByGateId && !g.IsDeleted))
            return "The selected filter gate does not exist.";

        return null;
    }

    /// <summary>
    /// Reports Offline when the last heartbeat is older than the grace period, so a
    /// panel that died without saying so is not still shown as Online.
    /// </summary>
    private static DisplayMasterListModel MapToListModel(DisplayMaster d)
    {
        var status = d.ConnectionStatus;
        if (d.LastHeartbeatAt is null)
            status = "Unknown";
        else if (DateTime.UtcNow - d.LastHeartbeatAt.Value > HeartbeatGrace)
            status = "Offline";

        return new DisplayMasterListModel
        {
            Id = d.Id,
            DisplayCode = d.DisplayCode,
            DisplayName = d.DisplayName,
            DisplayType = d.DisplayType,
            GateId = d.GateId,
            GateName = d.Gate?.GateName,
            Location = d.Location,
            IpAddress = d.IpAddress,
            ScreenSize = d.ScreenSize,
            WidthPx = d.WidthPx,
            HeightPx = d.HeightPx,
            VisibleRowCount = d.VisibleRowCount,
            FilterByGateId = d.FilterByGateId,
            FilterByGateName = d.FilterByGate?.GateName,
            LastHeartbeatAt = d.LastHeartbeatAt,
            ConnectionStatus = status,
            IsActive = d.IsActive,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        };
    }
}
