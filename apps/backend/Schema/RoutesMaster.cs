using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("routes_master")]
public partial class RoutesMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string? RouteCode { get; set; }

    [MaxLength(100)]
    public string RouteName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? LedDisplayName { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public int? CreatedById { get; set; }

    public int? UpdatedById { get; set; }

    public virtual ICollection<BusesMaster> Buses { get; set; } = new List<BusesMaster>();
}
