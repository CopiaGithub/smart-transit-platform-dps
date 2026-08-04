using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

/// <summary>
/// Physical gates and building exits. Gate 6 is the bus entry, Gate 1 the exit,
/// and the two student doors are the exits the indoor displays serve.
/// </summary>
[Table("gate_master")]
public partial class GateMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string GateCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string GateName { get; set; } = string.Empty;

    /// <summary>BusEntry / BusExit / StudentExit.</summary>
    [MaxLength(20)]
    public string GateType { get; set; } = "BusEntry";

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<DisplayMaster> Displays { get; set; } = new List<DisplayMaster>();

    public virtual ICollection<PlatformsMaster> Platforms { get; set; } = new List<PlatformsMaster>();
}
