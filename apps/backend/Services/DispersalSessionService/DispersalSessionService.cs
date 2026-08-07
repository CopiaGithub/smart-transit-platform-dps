using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.DispersalSessionService;

public class DispersalSessionService : IDispersalSessionService
{
    public const string Open = "Open";
    public const string Closed = "Closed";

    private const string DefaultShift = "Afternoon Pickup";

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    private readonly ISchoolClock _clock;

    public DispersalSessionService(
        ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility, ISchoolClock clock)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _clock = clock;
    }

    public async Task<ServiceResponseDto<PagedResult<DispersalSessionListModel>>> GetAllAsync(
        PaginationFilterDto filter, string? sessionStatus = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.Sessions.Where(s => !s.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(s => s.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(sessionStatus))
            query = query.Where(s => s.Status == sessionStatus);

        int totalRecords = await query.CountAsync();

        query = filter.Descending
            ? query.OrderByDescending(s => s.SessionDate).ThenByDescending(s => s.Id)
            : query.OrderByDescending(s => s.SessionDate).ThenBy(s => s.Id);

        var sessions = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
        var items = new List<DispersalSessionListModel>();
        foreach (var s in sessions)
            items.Add(await MapAsync(s));

        return new ServiceResponseDto<PagedResult<DispersalSessionListModel>>
        {
            Data = new PagedResult<DispersalSessionListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Sessions fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<DispersalSessionListModel>> GetByIdAsync(int id)
    {
        var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (session == null)
            return new ServiceResponseDto<DispersalSessionListModel> { Success = false, Message = "Session not found." };

        return new ServiceResponseDto<DispersalSessionListModel> { Data = await MapAsync(session) };
    }

    public async Task<ServiceResponseDto<DispersalSessionListModel>> GetCurrentAsync()
    {
        var session = await CurrentSessionAsync();
        if (session == null)
            return new ServiceResponseDto<DispersalSessionListModel>
            {
                Success = false,
                Message = "No dispersal session is open. Open one before recording bus movements."
            };

        return new ServiceResponseDto<DispersalSessionListModel> { Data = await MapAsync(session) };
    }

    /// <summary>The newest open session — what gate operators are working against.</summary>
    public Task<Sessions?> CurrentSessionAsync() =>
        _context.Sessions
            .Where(s => !s.IsDeleted && s.Status == Open)
            .OrderByDescending(s => s.SessionDate)
            .ThenByDescending(s => s.Id)
            .FirstOrDefaultAsync();

    public async Task<ServiceResponseDto<DispersalSessionListModel>> OpenAsync(OpenSessionModel model)
    {
        // The school's own calendar date, not UTC's — see SchoolClock.
        var date = model.SessionDate ?? _clock.Today;
        var shift = string.IsNullOrWhiteSpace(model.ShiftName) ? DefaultShift : model.ShiftName.Trim();

        // Two open sessions would split the platform allocation into two conflicting
        // views of one physical yard.
        var alreadyOpen = await _context.Sessions
            .FirstOrDefaultAsync(s => !s.IsDeleted && s.Status == Open);
        if (alreadyOpen != null)
            return new ServiceResponseDto<DispersalSessionListModel>
            {
                Success = false,
                Message = $"A session is already open for {alreadyOpen.SessionDate:yyyy-MM-dd} " +
                          $"({alreadyOpen.ShiftName}). Close it before opening another."
            };

        var currentUserId = _jwtTokenUtility.GetUserId();

        // One afternoon is one session (§2.1), so a second row for the same date
        // and shift would split that day's report in two. But refusing outright
        // strands an operator who closed the afternoon by mistake, or who had to
        // force-close it to clear a stuck bus and now needs to carry on — and
        // the app opens with a fixed shift name, so they cannot work around it.
        // Reopening the existing row satisfies both. ResetAt is deliberately
        // left in place: the audit trail must still show it was ended by hand.
        var existing = await _context.Sessions
            .FirstOrDefaultAsync(s => !s.IsDeleted && s.SessionDate == date && s.ShiftName == shift);

        if (existing != null)
        {
            existing.Status = Open;
            existing.EndedAt = null;
            existing.IsActive = true;
            existing.UpdatedById = currentUserId;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new ServiceResponseDto<DispersalSessionListModel>
            {
                Data = await MapAsync(existing),
                Message = "Dispersal session reopened."
            };
        }

        var session = new Sessions
        {
            SessionDate = date,
            ShiftName = shift,
            StartedAt = DateTime.UtcNow,
            Status = Open,
            IsActive = true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        return new ServiceResponseDto<DispersalSessionListModel>
        {
            Data = await MapAsync(session),
            Message = "Dispersal session opened."
        };
    }

    public async Task<ServiceResponseDto<bool>> CloseAsync(int id)
    {
        var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (session == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Session not found." };

        if (session.Status == Closed)
            return new ServiceResponseDto<bool> { Success = false, Message = "This session is already closed." };

        // Refuse to close over buses still in the yard — that would strand them on
        // the board with no way to depart them.
        int live = await _context.BoardingEvents.CountAsync(e =>
            e.SessionId == id && !e.IsDeleted && BoardingStatus.Live.Contains(e.Status));
        if (live > 0)
            return new ServiceResponseDto<bool>
            {
                Success = false,
                Message = $"{live} bus(es) are still in the yard. Depart them, or use reset to force-clear."
            };

        session.Status = Closed;
        session.EndedAt = DateTime.UtcNow;
        session.UpdatedById = _jwtTokenUtility.GetUserId();
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Dispersal session closed." };
    }

    public async Task<ServiceResponseDto<bool>> ResetAsync(int id)
    {
        var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (session == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Session not found." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var now = DateTime.UtcNow;

        var live = await _context.BoardingEvents
            .Where(e => e.SessionId == id && !e.IsDeleted && BoardingStatus.Live.Contains(e.Status))
            .ToListAsync();

        foreach (var e in live)
        {
            e.Status = BoardingStatus.Departed;
            e.DepartedAt = now;
            e.Notes = string.IsNullOrWhiteSpace(e.Notes)
                ? "Force-cleared on end-of-day reset."
                : e.Notes + " | Force-cleared on end-of-day reset.";
            e.UpdatedById = currentUserId;
            e.UpdatedAt = now;
        }

        session.Status = Closed;
        session.EndedAt ??= now;
        session.ResetAt = now;
        session.UpdatedById = currentUserId;
        session.UpdatedAt = now;

        _context.AuditLogs.Add(new AuditLog
        {
            SessionId = session.Id,
            ActorUserId = currentUserId,
            ActorName = _jwtTokenUtility.GetCurrentUserClaims()?.Username,
            ActionType = "ForceClear",
            PreviousValue = $"{live.Count} live event(s)",
            NewValue = "Session reset",
            Details = $"End-of-day reset force-cleared {live.Count} bus(es).",
            CreatedById = currentUserId,
            UpdatedById = currentUserId
        });

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool>
        {
            Data = true,
            Message = $"Session reset. {live.Count} bus(es) were force-cleared."
        };
    }

    private async Task<DispersalSessionListModel> MapAsync(Sessions s)
    {
        var counts = await _context.BoardingEvents
            .Where(e => e.SessionId == s.Id && !e.IsDeleted)
            .GroupBy(e => e.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        int By(params string[] statuses) =>
            counts.Where(c => statuses.Contains(c.Status)).Sum(c => c.Count);

        return new DispersalSessionListModel
        {
            Id = s.Id,
            SessionDate = s.SessionDate,
            ShiftName = s.ShiftName,
            StartedAt = s.StartedAt,
            EndedAt = s.EndedAt,
            Status = s.Status,
            ResetAt = s.ResetAt,
            TotalBuses = counts.Sum(c => c.Count),
            InYard = By(BoardingStatus.Arrived, BoardingStatus.Boarding),
            Waiting = By(BoardingStatus.Waiting),
            Departed = By(BoardingStatus.Departed),
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }
}
