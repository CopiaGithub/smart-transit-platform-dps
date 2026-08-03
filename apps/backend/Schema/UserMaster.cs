using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("usermaster")]
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

    [MaxLength(255)]
    public string? Password { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? EmployeeCode { get; set; }

    public int? RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(RoleId))]
    public virtual RoleMaster? Role { get; set; }
}
