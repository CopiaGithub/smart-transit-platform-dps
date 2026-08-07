namespace transit_display_platform_api.Common;

/// <summary>
/// "What date is it at the school right now?"
///
/// Dispersal is a local-calendar event: the afternoon of the 7th belongs to the
/// 7th whatever UTC thinks. Deriving it from <see cref="DateTime.UtcNow"/> put
/// India half a day behind between midnight and 05:30 IST, so a session opened
/// late in the evening — or by anyone testing after hours — was filed under
/// yesterday and blocked the real one.
///
/// The zone is configurable because the platform is meant to serve more than
/// one school from one deployment.
/// </summary>
public interface ISchoolClock
{
    /// <summary>Today's date in the school's own time zone.</summary>
    DateOnly Today { get; }

    /// <summary>Now, in the school's own time zone.</summary>
    DateTime Now { get; }
}

public class SchoolClock : ISchoolClock
{
    /// <summary>Falls back to IST — the only school on the platform today.</summary>
    public const string DefaultTimeZoneId = "India Standard Time";

    private readonly TimeZoneInfo _zone;

    public SchoolClock(IConfiguration configuration, ILogger<SchoolClock> logger)
    {
        var id = configuration["School:TimeZoneId"];
        if (string.IsNullOrWhiteSpace(id)) id = DefaultTimeZoneId;

        try
        {
            _zone = TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            // A misconfigured zone must not take the API down, but silently
            // running on UTC is exactly the bug this class exists to fix — so
            // it has to be loud.
            logger.LogError(ex,
                "School:TimeZoneId '{TimeZoneId}' was not found. Session dates will use UTC, " +
                "which will file an evening dispersal under the wrong day.", id);
            _zone = TimeZoneInfo.Utc;
        }
    }

    public DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _zone);

    public DateOnly Today => DateOnly.FromDateTime(Now.Date);
}
