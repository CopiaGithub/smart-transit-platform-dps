using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;

namespace transit_display_platform_api.Data;

/// <summary>
/// Rewrites the demo accounts to short, typo-proof credentials so a tester can
/// switch roles on a phone without typing a ten-digit number and a symbol-heavy
/// password each time.
///
/// Separate from <see cref="DemoDataSeeder"/> on purpose: that seeder promises
/// never to update an existing row, which is what makes it safe to run against a
/// database that already holds data. This one exists precisely to overwrite, so
/// it is gated twice — an explicit opt-in flag, and a hard refusal to run
/// outside Development. A six-digit password must never reach a real school.
/// </summary>
public static class DevLoginsSeeder
{
    private const string DefaultPassword = "123456";

    /// <summary>Employee code -> the mobile number a tester will actually type.</summary>
    private static readonly (string Code, string Contact, string Post)[] Logins =
    {
        ("EMP002", "1111111111", "Entry gate (Gate 6)"),
        ("EMP004", "2222222222", "Teacher"),
        ("EMP003", "3333333333", "Exit gate (Gate 1)"),
        ("PAR001", "4444444444", "Parent"),
        ("EMP001", "5555555555", "Admin"),
    };

    public static async Task ApplyAsync(
        ApplicationDbContext db,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger logger)
    {
        if (!configuration.GetValue<bool>("Seed:SimpleDevLogins"))
            return;

        if (!environment.IsDevelopment())
        {
            logger.LogError(
                "Seed:SimpleDevLogins is enabled outside Development ({Environment}) and was " +
                "ignored. Remove it from configuration — it sets a trivial password on every " +
                "demo account.", environment.EnvironmentName);
            return;
        }

        var password = configuration["Seed:DevPassword"];
        if (string.IsNullOrWhiteSpace(password)) password = DefaultPassword;
        var hash = PasswordHasher.Hash(password);
        var now = DateTime.UtcNow;

        // Every demo account gets the same password, so no tester has to
        // remember which one is which.
        var users = await db.UserMasters.Where(u => !u.IsDeleted).ToListAsync();
        foreach (var user in users)
        {
            user.PasswordHash = hash;
            user.PasswordUpdatedAt = now;
            // The app has no change-password screen yet; leaving this set would
            // be a flag nothing can clear.
            user.MustChangePassword = false;
            user.UpdatedAt = now;
        }

        // Only the sign-in contact changes. ParentMaster.MobileNumber is left
        // alone deliberately: DemoDataSeeder identifies a parent by that number,
        // so rewriting it makes the seeder fail to recognise the row on the next
        // start and try to insert a duplicate. Login never reads it — the app
        // resolves a parent by user id.
        foreach (var (code, contact, _) in Logins)
        {
            var user = users.FirstOrDefault(u => u.EmployeeCode == code);
            if (user != null) user.Contact = contact;
        }

        await db.SaveChangesAsync();

        logger.LogWarning(
            "Simple dev logins applied: password '{Password}' on all {Count} demo accounts. " +
            "Development only.", password, users.Count);
        foreach (var (code, contact, post) in Logins)
            logger.LogInformation("  {Contact}  {Code,-8} {Post}", contact, code, post);
    }

    /// <summary>
    /// Empties the open session's board so a tester starts from nothing.
    ///
    /// This is not what force-close does, and must not be confused with it:
    /// closing a session ends the day and deliberately keeps every row, because
    /// those rows are the day's record (§5.10). Re-opening the same date and
    /// shift resumes that record, which is right in production and maddening
    /// when you are running the same flow twenty times in an afternoon.
    ///
    /// Soft-deleted, so a row can be brought back by flipping IsDeleted.
    /// </summary>
    public static async Task ClearOpenSessionBoardAsync(
        ApplicationDbContext db,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger logger)
    {
        if (!configuration.GetValue<bool>("Seed:ClearBoardOnStart"))
            return;

        if (!environment.IsDevelopment())
        {
            logger.LogError(
                "Seed:ClearBoardOnStart is enabled outside Development ({Environment}) and was " +
                "ignored. It erases a dispersal's record.", environment.EnvironmentName);
            return;
        }

        var session = await db.Sessions
            .Where(s => !s.IsDeleted && s.Status == "Open")
            .OrderByDescending(s => s.SessionDate).ThenByDescending(s => s.Id)
            .FirstOrDefaultAsync();

        if (session == null) return;

        var events = await db.BoardingEvents
            .Where(e => e.SessionId == session.Id && !e.IsDeleted)
            .ToListAsync();

        if (events.Count == 0) return;

        var now = DateTime.UtcNow;
        foreach (var e in events)
        {
            e.IsDeleted = true;
            e.UpdatedAt = now;
        }

        // A cleared board is not a day that was ended by hand.
        session.ResetAt = null;
        session.EndedAt = null;
        session.UpdatedAt = now;

        await db.SaveChangesAsync();

        logger.LogWarning(
            "Cleared {Count} boarding event(s) from session {SessionId} ({Date}). " +
            "Development only.", events.Count, session.Id, session.SessionDate);
    }
}
