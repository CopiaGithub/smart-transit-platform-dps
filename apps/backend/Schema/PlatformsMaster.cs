using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("platforms_master")]
public partial class PlatformsMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>Fixed platform number in the compound (1–23).</summary>
    public int PlatformNumber { get; set; }

    [MaxLength(50)]
    public string? PlatformName { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();
}
