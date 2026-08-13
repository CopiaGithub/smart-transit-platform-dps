using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;

namespace transit_display_platform_api.Services.PinCodeMasterService;

public class PinCodeMasterService : IPinCodeMasterService
{
    private readonly ApplicationDbContext _context;

    public PinCodeMasterService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto<PagedResult<PinCodeMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, int? cityId = null, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.PinCodeMasters
            .Include(p => p.City)
                .ThenInclude(c => c!.State)
                    .ThenInclude(s => s!.Country)
            .Where(p => !p.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive;
        if (activeFilter.HasValue)
            query = query.Where(p => p.IsActive == activeFilter.Value);

        if (cityId.HasValue)
            query = query.Where(p => p.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(p =>
                p.PinCode.Contains(term) ||
                (p.City != null && p.City.CityName.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.PinCode)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PinCodeMasterListModel
            {
                Id = p.Id,
                PinCode = p.PinCode,
                CityId = p.CityId,
                CityName = p.City != null ? p.City.CityName : null,
                StateId = p.City != null ? p.City.StateId : null,
                StateName = p.City != null && p.City.State != null
                    ? p.City.State.StateName
                    : null,
                CountryId = p.City != null && p.City.State != null
                    ? p.City.State.CountryId
                    : null,
                CountryName = p.City != null && p.City.State != null && p.City.State.Country != null
                    ? p.City.State.Country.CountryName
                    : null,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return new ServiceResponseDto<PagedResult<PinCodeMasterListModel>>
        {
            Data = new PagedResult<PinCodeMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Pincodes fetched successfully."
        };
    }
}
