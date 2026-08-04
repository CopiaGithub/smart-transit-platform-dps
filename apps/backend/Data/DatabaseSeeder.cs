using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Data;

/// <summary>
/// Repairs credentials left unusable by the MD5 → BCrypt migration.
///
/// The old hashes cannot be converted (MD5 is one-way and the plaintext is unknown),
/// so any account still holding a non-BCrypt hash is reset to a password supplied via
/// configuration and flagged <see cref="UserMaster.MustChangePassword"/>. The password
/// is never committed to source — set <c>Seed:AdminPassword</c> in user-secrets or the
/// <c>SEED__ADMINPASSWORD</c> environment variable.
/// </summary>
public static class DatabaseSeeder
{
    /// <summary>BCrypt hashes always carry this prefix; anything else is a legacy MD5 value.</summary>
    private static bool IsBCryptHash(string? hash) =>
        !string.IsNullOrEmpty(hash) &&
        (hash.StartsWith("$2a$") || hash.StartsWith("$2b$") || hash.StartsWith("$2y$"));

    public static async Task ResetLegacyPasswordsAsync(
        ApplicationDbContext context, IConfiguration configuration, ILogger logger)
    {
        var seedPassword = configuration["Seed:AdminPassword"];

        var staleUsers = await context.UserMasters
            .Where(u => !u.IsDeleted)
            .ToListAsync();

        staleUsers = staleUsers.Where(u => !IsBCryptHash(u.PasswordHash)).ToList();

        if (staleUsers.Count == 0)
            return;

        if (string.IsNullOrWhiteSpace(seedPassword))
        {
            logger.LogWarning(
                "{Count} user account(s) still hold pre-BCrypt password hashes and cannot log in. " +
                "Set Seed:AdminPassword (or SEED__ADMINPASSWORD) and restart to reset them.",
                staleUsers.Count);
            return;
        }

        var hash = PasswordHasher.Hash(seedPassword);
        var now = DateTime.UtcNow;

        foreach (var user in staleUsers)
        {
            user.PasswordHash = hash;
            user.PasswordUpdatedAt = now;
            user.MustChangePassword = true;
            user.FailedLoginAttempts = 0;
            user.LockoutEndsAt = null;
            user.UpdatedAt = now;
        }

        await context.SaveChangesAsync();

        logger.LogWarning(
            "Reset {Count} legacy password hash(es) to the configured seed password. " +
            "All affected users must change their password at next login.",
            staleUsers.Count);
    }
}
