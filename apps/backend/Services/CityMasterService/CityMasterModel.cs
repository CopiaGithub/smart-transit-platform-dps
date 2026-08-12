namespace transit_display_platform_api.Services.CityMasterService;

public class CityMasterListModel
{
    public int Id { get; set; }
    public string? CityCode { get; set; }
    public string CityName { get; set; } = string.Empty;
    public int? StateId { get; set; }
    public string? StateName { get; set; }
    public int? RegionId { get; set; }
    public string? RegionName { get; set; }

    /// <summary>
    /// Reached through the state, since a city has no country of its own.
    ///
    /// Carried even though the list grid does not show it: the View dialog asks
    /// for Country, and its State picker cascades off the country. Without this
    /// the dialog had a state id but no country to scope the options to, so the
    /// State and Region boxes rendered blank on a record that clearly had both.
    /// </summary>
    public int? CountryId { get; set; }
    public string? CountryName { get; set; }

    public bool IsActive { get; set; }
}
