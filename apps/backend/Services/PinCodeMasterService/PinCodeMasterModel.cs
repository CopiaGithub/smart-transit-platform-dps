namespace transit_display_platform_api.Services.PinCodeMasterService;

public class PinCodeMasterListModel
{
    public int Id { get; set; }
    public string PinCode { get; set; } = string.Empty;
    public int? CityId { get; set; }
    public string? CityName { get; set; }

    /// <summary>
    /// The rest of the chain above the city, reached through it.
    ///
    /// Carried for the View dialog rather than the grid: its City picker cascades
    /// off State, which cascades off Country. With only a city id to work from,
    /// the dialog could not scope either parent list and rendered all three boxes
    /// blank on a record that had a perfectly good city.
    /// </summary>
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public int? CountryId { get; set; }
    public string? CountryName { get; set; }

    public bool IsActive { get; set; }
}
