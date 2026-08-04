using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("state_master")]
public partial class StateMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string? StateCode { get; set; }

    [MaxLength(100)]
    public string StateName { get; set; } = string.Empty;

    public int? CountryId { get; set; }

    public int? RegionId { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(CountryId))]
    public virtual CountryMaster? Country { get; set; }

    [ForeignKey(nameof(RegionId))]
    public virtual RegionMaster? Region { get; set; }

    public virtual ICollection<CityMaster> Cities { get; set; } = new List<CityMaster>();
}
