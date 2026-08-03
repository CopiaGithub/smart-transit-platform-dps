using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.CityMasterService;

public class CityMasterService : ICityMasterService
{
    private readonly ApplicationDbContext _context;

    public CityMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<CityMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? stateId = null, int? regionId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.CityMasters
            .Include(c => c.State)
            .Include(c => c.Region)
            .Where(c => !c.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(c => c.IsActive == activeFilter.Value);

        if (stateId.HasValue)
            query = query.Where(c => c.StateId == stateId.Value);

        if (regionId.HasValue)
            query = query.Where(c => c.RegionId == regionId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(c =>
                c.CityName.Contains(term) ||
                (c.CityCode != null && c.CityCode.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.CityName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CityMasterListModel
            {
                Id = c.Id,
                CityCode = c.CityCode,
                CityName = c.CityName,
                StateId = c.StateId,
                StateName = c.State != null ? c.State.StateName : null,
                RegionId = c.RegionId,
                RegionName = c.Region != null ? c.Region.RegionName : null,
                IsActive = c.IsActive
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<CityMasterListModel>>
        {
            Data = new PagedResult<CityMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Cities fetched successfully."
        };
    }
}
