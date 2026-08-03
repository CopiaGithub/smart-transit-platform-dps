using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("menu_assignment")]
public partial class MenuAssignment : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int MenuId { get; set; }

    public int RoleId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(MenuId))]
    public virtual MenuMaster? Menu { get; set; }

    [ForeignKey(nameof(RoleId))]
    public virtual RoleMaster? Role { get; set; }
}
