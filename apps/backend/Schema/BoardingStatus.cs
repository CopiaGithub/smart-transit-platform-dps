namespace transit_display_platform_api.Schema;

/// <summary>
/// The bus lifecycle during a dispersal, in the vocabulary used by the InfoLED
/// proposal and by apps/mobile (constants/domain.ts). Defined once because these
/// strings are also baked into filtered unique index predicates in
/// ApplicationDbContext — a typo in either place silently disables a constraint.
/// </summary>
public static class BoardingStatus
{
    /// <summary>In the yard but holding: every marked platform is occupied.</summary>
    public const string Waiting = "Waiting";

    /// <summary>Through the entry gate and holding a platform.</summary>
    public const string Arrived = "Arrived";

    /// <summary>Students are boarding.</summary>
    public const string Boarding = "Boarding";

    /// <summary>Out through the exit gate. The platform is free again.</summary>
    public const string Departed = "Departed";

    /// <summary>Pulled out of service; a reserve bus took over this run.</summary>
    public const string Replaced = "Replaced";

    public static readonly string[] All =
        { Waiting, Arrived, Boarding, Departed, Replaced };

    /// <summary>Holding a platform, so it blocks that platform for anyone else.</summary>
    public static readonly string[] Occupying = { Arrived, Boarding };

    /// <summary>Still part of today's run — not yet departed or replaced.</summary>
    public static readonly string[] Live = { Waiting, Arrived, Boarding };

    /// <summary>
    /// Live board ordering: active work at the top, departures sink to the bottom.
    /// Mirrors STATUS_RANK in apps/mobile/constants/domain.ts.
    /// </summary>
    public static int Rank(string status) => status switch
    {
        Boarding => 0,
        Arrived => 1,
        Waiting => 2,
        Replaced => 3,
        Departed => 4,
        _ => 9,
    };
}
