using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.StateMasterService;

public class StateMasterService : IStateMasterService
{
    private readonly ApplicationDbContext _context;

    public StateMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<StateMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? countryId = null, int? regionId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.StateMasters
            .Include(s => s.Country)
            .Include(s => s.Region)
            .Where(s => !s.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(s => s.IsActive == activeFilter.Value);

        if (countryId.HasValue)
            query = query.Where(s => s.CountryId == countryId.Value);

        if (regionId.HasValue)
            query = query.Where(s => s.RegionId == regionId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(s =>
                s.StateName.Contains(term) ||
                (s.StateCode != null && s.StateCode.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(s => s.StateName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new StateMasterListModel
            {
                Id = s.Id,
                StateCode = s.StateCode,
                StateName = s.StateName,
                CountryId = s.CountryId,
                CountryName = s.Country != null ? s.Country.CountryName : null,
                RegionId = s.RegionId,
                RegionName = s.Region != null ? s.Region.RegionName : null,
                IsActive = s.IsActive
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<StateMasterListModel>>
        {
            Data = new PagedResult<StateMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "States fetched successfully."
        };
    }
}
