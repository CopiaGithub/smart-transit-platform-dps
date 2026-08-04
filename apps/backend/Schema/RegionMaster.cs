using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("region_master")]
public partial class RegionMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string? RegionCode { get; set; }

    [MaxLength(100)]
    public string RegionName { get; set; } = string.Empty;

    public int? CountryId { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(CountryId))]
    public virtual CountryMaster? Country { get; set; }

    public virtual ICollection<StateMaster> States { get; set; } = new List<StateMaster>();

    public virtual ICollection<CityMaster> Cities { get; set; } = new List<CityMaster>();
}
