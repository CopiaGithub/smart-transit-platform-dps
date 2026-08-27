using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.DispersalSessionService;

/// <summary>
/// Closes a dispersal session the moment the school's calendar day has moved past
/// its date. One afternoon is one session (§2.1); a session left open overnight —
/// nobody force-closed it, or the server was down at end of day — would otherwise
/// carry yesterday's board into today and block a fresh one from opening.
///
/// Runs on a timer rather than through <see cref="DispersalSessionService.CurrentSessionAsync"/>
/// so the hot read path (including the anonymous public board and mid-transaction
/// gate operations) never turns a read into a write. A pass also runs at startup,
/// which is what catches the server that was off across midnight.
///
/// Live buses on a stale session are force-departed the same way an end-of-day
/// reset does — the day is genuinely over, so leaving them "in the yard" is wrong.
/// </summary>
public class SessionAutoCloseService : BackgroundService
{
    // Close within a quarter hour of midnight. Tighter buys nothing — no dispersal
    // runs at 00:00 — and a slower loop would leave yesterday's session open into
    // the morning.
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ISchoolClock _clock;
    private readonly ILogger<SessionAutoCloseService> _logger;

    public SessionAutoCloseService(
        IServiceScopeFactory scopeFactory,
        ISchoolClock clock,
        ILogger<SessionAutoCloseService> logger)
    {
        _scopeFactory = scopeFactory;
        _clock = clock;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CloseStaleSessionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break; // shutting down
            }
            catch (Exception ex)
            {
                // A failed pass must not kill the loop — the next tick tries again.
                _logger.LogError(ex, "Session auto-close pass failed.");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task CloseStaleSessionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var today = _clock.Today;

        var stale = await db.Sessions
            .Where(s => !s.IsDeleted
                     && s.Status == DispersalSessionService.Open
                     && s.SessionDate < today)
            .ToListAsync(ct);
        if (stale.Count == 0) return;

        var now = DateTime.UtcNow;

        foreach (var session in stale)
        {
            var live = await db.BoardingEvents
                .Where(e => e.SessionId == session.Id && !e.IsDeleted
                         && BoardingStatus.Live.Contains(e.Status))
                .ToListAsync(ct);

            foreach (var e in live)
            {
                e.Status = BoardingStatus.Departed;
                e.DepartedAt = now;
                e.Notes = string.IsNullOrWhiteSpace(e.Notes)
                    ? "Auto-cleared: the day changed."
                    : e.Notes + " | Auto-cleared: the day changed.";
                e.UpdatedAt = now;
            }

            session.Status = DispersalSessionService.Closed;
            session.EndedAt ??= now;
            session.UpdatedAt = now;

            // No actor: this is the system acting, not a user, so the audit's
            // actor columns are left null (they are nullable for exactly this).
            db.AuditLogs.Add(new AuditLog
            {
                SessionId = session.Id,
                ActionType = "AutoClose",
                PreviousValue = DispersalSessionService.Open,
                NewValue = DispersalSessionService.Closed,
                Details = $"Session for {session.SessionDate:yyyy-MM-dd} auto-closed on day change; " +
                          $"{live.Count} bus(es) auto-cleared.",
                CreatedAt = now,
                UpdatedAt = now
            });

            _logger.LogInformation(
                "Auto-closed dispersal session {SessionId} for {SessionDate}; cleared {LiveCount} live bus(es).",
                session.Id, session.SessionDate, live.Count);
        }

        await db.SaveChangesAsync(ct);
    }
}
