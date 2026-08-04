using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace transit_display_platform_api.Schema;

[Table("buses_master")]
public partial class BusesMaster : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [MaxLength(20)]
    public string BusNumber { get; set; } = string.Empty;

    public int? RouteId { get; set; }

    /// <summary>Active daily service or reserve substitute bus.</summary>
    [MaxLength(20)]
    public string BusType { get; set; } = "Active";

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(RouteId))]
    public virtual RoutesMaster? Route { get; set; }

    public virtual ICollection<BoardingEvents> BoardingEvents { get; set; } = new List<BoardingEvents>();
}
