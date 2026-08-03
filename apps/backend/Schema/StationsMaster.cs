using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("stations_master")]
public partial class StationsMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    /// <summary>Fixed station number in the compound (1–23).</summary>
    public int StationNumber { get; set; }

    [MaxLength(50)]
    public string? StationName { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();
}
