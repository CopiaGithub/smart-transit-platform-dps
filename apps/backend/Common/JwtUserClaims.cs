namespace transit_display_platform_api.Common;

public class JwtUserClaims
{
    public int UserId { get; set; }
    public string? Username { get; set; }
    public string? EmailId { get; set; }
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
}
