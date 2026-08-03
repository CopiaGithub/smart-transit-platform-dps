using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("pincode_master")]
public partial class PinCodeMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string PinCode { get; set; } = string.Empty;

    public int? CityId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    [ForeignKey(nameof(CityId))]
    public virtual CityMaster? City { get; set; }
}
