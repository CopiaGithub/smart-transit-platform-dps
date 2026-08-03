using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("country_master")]
public partial class CountryMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string? CountryCode { get; set; }

    [MaxLength(100)]
    public string CountryName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public virtual ICollection<RegionMaster> Regions { get; set; } = new List<RegionMaster>();

    public virtual ICollection<StateMaster> States { get; set; } = new List<StateMaster>();
}
