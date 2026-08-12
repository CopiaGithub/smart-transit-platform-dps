namespace transit_display_platform_api.Common;

public class PaginationFilterDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? SortBy { get; set; } = "Name";
    public bool Descending { get; set; } = false;
    public string? SearchTerm { get; set; }

    /// <summary>
    /// Filters a master list by status: true = active only, false = inactive only,
    /// omitted = both.
    ///
    /// "Omitted means both" is the contract the screens are built on — their Status
    /// filter sends nothing when it is left blank, and a blank filter has to mean
    /// "no restriction" for the same reason every other filter does. This used to
    /// default to Active-only, which made inactive records unreachable: there was
    /// no value that meant "all", so a deactivated bus or platform simply vanished.
    ///
    /// Consumers that need active-only must now say so. LookupService on the web
    /// client pins IsActive=true for exactly this reason — a dropdown should never
    /// offer a record that has been retired.
    /// </summary>
    public bool? IsActive { get; set; }
}

public static class PaginationHelper
{
    public static (int pageNumber, int pageSize) Normalize(this PaginationFilterDto filter)
    {
        int pageNumber = filter.PageNumber <= 0 ? 1 : filter.PageNumber;
        int pageSize = filter.PageSize <= 0 ? 25 : filter.PageSize;
        return (pageNumber, pageSize);
    }
}
