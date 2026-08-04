using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("user_master")]
public partial class UserMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Contact { get; set; }

    [MaxLength(100)]
    public string? EmailId { get; set; }

    /// <summary>BCrypt hash (salt is embedded in the hash). Never a plaintext or MD5 value.</summary>
    [MaxLength(255)]
    public string? PasswordHash { get; set; }

    public DateTime? PasswordUpdatedAt { get; set; }

    public bool MustChangePassword { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public int FailedLoginAttempts { get; set; }

    public DateTime? LockoutEndsAt { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? EmployeeCode { get; set; }

    public int? RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(RoleId))]
    public virtual RoleMaster? Role { get; set; }
}
