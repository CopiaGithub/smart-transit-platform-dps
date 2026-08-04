namespace transit_display_platform_api.Common;

/// <summary>
/// BCrypt password hashing. Replaces the previous unsalted MD5 implementation, which
/// was reversible via rainbow tables and unusable for credential storage.
/// The per-password salt is generated automatically and stored inside the hash string.
/// </summary>
public static class PasswordHasher
{
    /// <summary>Cost 12 — roughly 250ms per hash on current hardware.</summary>
    private const int WorkFactor = 12;

    public static string Hash(string plainText)
    {
        if (string.IsNullOrWhiteSpace(plainText))
            throw new ArgumentException("Password must not be empty.", nameof(plainText));

        return BCrypt.Net.BCrypt.HashPassword(plainText, WorkFactor);
    }

    public static bool Verify(string? plainText, string? storedHash)
    {
        if (string.IsNullOrEmpty(plainText) || string.IsNullOrEmpty(storedHash))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(plainText, storedHash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // A legacy MD5 hash left over from before the migration. It cannot be a
            // valid credential any more, so treat it as a failed login rather than
            // silently accepting a weak hash.
            return false;
        }
    }
}
