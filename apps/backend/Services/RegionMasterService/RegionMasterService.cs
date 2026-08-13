using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.RegionMasterService;

public class RegionMasterService : IRegionMasterService
{
    private readonly ApplicationDbContext _context;

    public RegionMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<RegionMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? countryId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.RegionMasters
            .Include(r => r.Country)
            .Where(r => !r.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(r => r.IsActive == activeFilter.Value);

        if (countryId.HasValue)
            query = query.Where(r => r.CountryId == countryId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(r =>
                r.RegionName.Contains(term) ||
                (r.RegionCode != null && r.RegionCode.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(r => r.RegionName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RegionMasterListModel
            {
                Id = r.Id,
                RegionCode = r.RegionCode,
                RegionName = r.RegionName,
                CountryId = r.CountryId,
                CountryName = r.Country != null ? r.Country.CountryName : null,
                IsActive = r.IsActive
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<RegionMasterListModel>>
        {
            Data = new PagedResult<RegionMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Regions fetched successfully."
        };
    }
}
