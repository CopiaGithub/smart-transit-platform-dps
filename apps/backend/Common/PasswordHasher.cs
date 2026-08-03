using System.Security.Cryptography;
using System.Text;

namespace transit_display_platform_api.Common;

public static class PasswordHasher
{
    public static string HashMd5(string? plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            return string.Empty;

        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(plainText));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static bool VerifyMd5(string? plainText, string? storedHash)
    {
        if (string.IsNullOrEmpty(storedHash))
            return false;

        return string.Equals(HashMd5(plainText), storedHash, StringComparison.OrdinalIgnoreCase);
    }
}
