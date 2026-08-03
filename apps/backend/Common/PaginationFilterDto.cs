namespace transit_display_platform_api.Common;

public class PaginationFilterDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public string? SortBy { get; set; } = "Name";
    public bool Descending { get; set; } = false;
    public string? SearchTerm { get; set; }

    /// <summary>Defaults master lists to Active-only when null/true; pass false to include inactive.</summary>
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
