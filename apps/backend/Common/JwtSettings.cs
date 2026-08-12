namespace transit_display_platform_api.Common;

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    /// <summary>
    /// One school working day (8 hours).
    ///
    /// It was 60 minutes, which threw administrators out mid-task: there is no
    /// refresh flow — AuthController exposes login and nothing else — so when the
    /// token expired the next request simply 401'd and the app signed the user
    /// out, losing whatever form was open.
    ///
    /// The trade-off is deliberate and worth naming: a stolen token now stays
    /// valid for eight hours rather than one. That is acceptable for a school
    /// admin console on a private network, and the proper fix is a refresh token
    /// with server-side revocation, not a bigger number here. Revisit this when
    /// that lands rather than raising it again.
    /// </summary>
    public int AccessTokenExpiryMinutes { get; set; } = 480;
}
