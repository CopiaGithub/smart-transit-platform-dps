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

    /// <summary>
    /// Which arm of the U-shaped compound this platform sits on: "Left" or "Right".
    /// Null until assigned. Not derivable from the number, so it is stored explicitly.
    /// </summary>
    [MaxLength(10)]
    public string? Side { get; set; }

    /// <summary>
    /// Building exit this platform is nearest to. The compound is U-shaped with two
    /// student exits, so "which door do I walk out of" is not derivable from the number.
    /// </summary>
    public int? NearestGateId { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(NearestGateId))]
    public virtual GateMaster? NearestGate { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();
}
