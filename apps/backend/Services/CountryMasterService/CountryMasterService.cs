using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.CountryMasterService;

public class CountryMasterService : ICountryMasterService
{
    private readonly ApplicationDbContext _context;

    public CountryMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<CountryMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.CountryMasters.Where(c => !c.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(c => c.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(c =>
                c.CountryName.Contains(term) ||
                (c.CountryCode != null && c.CountryCode.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.CountryName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CountryMasterListModel
            {
                Id = c.Id,
                CountryCode = c.CountryCode,
                CountryName = c.CountryName,
                IsActive = c.IsActive
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<CountryMasterListModel>>
        {
            Data = new PagedResult<CountryMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Countries fetched successfully."
        };
    }
}
