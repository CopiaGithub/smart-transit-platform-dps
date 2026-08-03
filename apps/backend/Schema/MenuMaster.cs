using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("menu_master")]
public partial class MenuMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Route { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; }

    public int? ParentId { get; set; }

    public int OrderNo { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(ParentId))]
    public virtual MenuMaster? Parent { get; set; }

    public virtual ICollection<MenuMaster> Children { get; set; } = new List<MenuMaster>();

    public virtual ICollection<MenuAssignment> MenuAssignments { get; set; } = new List<MenuAssignment>();
}
