using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("city_master")]
public partial class CityMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string? CityCode { get; set; }

    [MaxLength(100)]
    public string CityName { get; set; } = string.Empty;

    public int? StateId { get; set; }

    public int? RegionId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(StateId))]
    public virtual StateMaster? State { get; set; }

    [ForeignKey(nameof(RegionId))]
    public virtual RegionMaster? Region { get; set; }

    public virtual ICollection<PinCodeMaster> PinCodes { get; set; } = new List<PinCodeMaster>();
}
