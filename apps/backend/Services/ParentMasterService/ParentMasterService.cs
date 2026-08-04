using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Services.ParentMasterService;

public class ParentMasterService : IParentMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;

    public ParentMasterService(ApplicationDbContext context, IJwtTokenUtility jwtTokenUtility)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
    }

    public async Task<ServiceResponseDto<PagedResult<ParentMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter, bool? status = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = _context.ParentMasters
            .Include(p => p.City)
            .Include(p => p.State)
            .Include(p => p.PinCode)
            .Where(p => !p.IsDeleted);

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(p => p.IsActive == activeFilter.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(p =>
                p.FirstName.Contains(term) ||
                p.LastName.Contains(term) ||
                p.MobileNumber.Contains(term) ||
                (p.Email != null && p.Email.Contains(term)));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "mobilenumber" => filter.Descending ? query.OrderByDescending(p => p.MobileNumber) : query.OrderBy(p => p.MobileNumber),
            "createdat" => filter.Descending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => filter.Descending
                ? query.OrderByDescending(p => p.FirstName).ThenByDescending(p => p.LastName)
                : query.OrderBy(p => p.FirstName).ThenBy(p => p.LastName),
        };

        var entities = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = entities.Select(p => p.Id).ToList();
        var childCounts = await _context.StudentParentMappings
            .Where(m => ids.Contains(m.ParentId) && !m.IsDeleted)
            .GroupBy(m => m.ParentId)
            .Select(g => new { ParentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ParentId, x => x.Count);

        var items = entities
            .Select(p => MapToListModel(p, childCounts.GetValueOrDefault(p.Id)))
            .ToList();

        return new ServiceResponseDto<PagedResult<ParentMasterListModel>>
        {
            Data = new PagedResult<ParentMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Parents fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<ParentMasterListModel>> GetByIdAsync(int id)
    {
        var parent = await LoadWithReferencesAsync(p => p.Id == id);
        if (parent == null)
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "Parent not found." };

        return new ServiceResponseDto<ParentMasterListModel> { Data = MapToListModel(parent, await CountChildrenAsync(id)) };
    }

    /// <summary>Mobile is the parent's de facto identity, so the app looks them up by it.</summary>
    public async Task<ServiceResponseDto<ParentMasterListModel>> GetByMobileAsync(string mobileNumber)
    {
        if (string.IsNullOrWhiteSpace(mobileNumber))
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "Mobile number is required." };

        var mobile = mobileNumber.Trim();
        var parent = await LoadWithReferencesAsync(p => p.MobileNumber == mobile);
        if (parent == null)
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "Parent not found." };

        return new ServiceResponseDto<ParentMasterListModel> { Data = MapToListModel(parent, await CountChildrenAsync(parent.Id)) };
    }

    public async Task<ServiceResponseDto<List<ParentChildModel>>> GetChildrenAsync(int id)
    {
        bool exists = await _context.ParentMasters.AnyAsync(p => p.Id == id && !p.IsDeleted);
        if (!exists)
            return new ServiceResponseDto<List<ParentChildModel>> { Success = false, Message = "Parent not found." };

        var children = await _context.StudentParentMappings
            .Where(m => m.ParentId == id && !m.IsDeleted)
            .Include(m => m.Student).ThenInclude(s => s!.Bus)
            .Include(m => m.Student).ThenInclude(s => s!.Route)
            .Include(m => m.Student).ThenInclude(s => s!.ExitGate)
            .Where(m => m.Student != null && !m.Student.IsDeleted)
            .OrderBy(m => m.ContactPriority)
            .Select(m => new ParentChildModel
            {
                StudentId = m.StudentId,
                AdmissionNumber = m.Student!.AdmissionNumber,
                StudentName = m.Student.FirstName + " " + m.Student.LastName,
                Class = m.Student.Grade + "-" + m.Student.Division,
                Relation = m.Relation,
                IsPrimaryContact = m.IsPrimaryContact,
                IsAuthorisedForPickup = m.IsAuthorisedForPickup,
                BusNumber = m.Student.Bus != null ? m.Student.Bus.BusNumber : null,
                RouteName = m.Student.Route != null ? m.Student.Route.RouteName : null,
                ExitGateName = m.Student.ExitGate != null ? m.Student.ExitGate.GateName : null
            })
            .ToListAsync();

        return new ServiceResponseDto<List<ParentChildModel>>
        {
            Data = children,
            TotalRecords = children.Count,
            Message = "Children fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<ParentMasterListModel>> CreateAsync(ParentMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.FirstName) || string.IsNullOrWhiteSpace(model.LastName))
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "First name and last name are required." };

        if (string.IsNullOrWhiteSpace(model.MobileNumber))
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "Mobile number is required." };

        var mobile = model.MobileNumber.Trim();
        bool exists = await _context.ParentMasters.AnyAsync(p => p.MobileNumber == mobile && !p.IsDeleted);
        if (exists)
            return new ServiceResponseDto<ParentMasterListModel> { Success = false, Message = "A parent with this mobile number already exists." };

        var currentUserId = _jwtTokenUtility.GetUserId();
        var parent = new ParentMaster
        {
            FirstName = model.FirstName.Trim(),
            MiddleName = model.MiddleName,
            LastName = model.LastName.Trim(),
            MobileNumber = mobile,
            AltMobileNumber = model.AltMobileNumber,
            Email = model.Email,
            Occupation = model.Occupation,
            AddressLine1 = model.AddressLine1,
            AddressLine2 = model.AddressLine2,
            CityId = model.CityId,
            StateId = model.StateId,
            PinCodeId = model.PinCodeId,
            PhotoUrl = model.PhotoUrl,
            IdProofType = model.IdProofType,
            IdProofNumber = model.IdProofNumber,
            UserId = model.UserId,
            IsWhatsAppEnabled = model.IsWhatsAppEnabled ?? true,
            IsSmsEnabled = model.IsSmsEnabled ?? true,
            IsMobileVerified = false,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ParentMasters.Add(parent);
        await _context.SaveChangesAsync();

        var saved = await LoadWithReferencesAsync(p => p.Id == parent.Id);
        return new ServiceResponseDto<ParentMasterListModel>
        {
            Data = MapToListModel(saved ?? parent, 0),
            Message = "Parent created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, ParentMasterUpdateModel model)
    {
        var parent = await _context.ParentMasters.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (parent == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Parent not found." };

        if (!string.IsNullOrWhiteSpace(model.MobileNumber) && model.MobileNumber.Trim() != parent.MobileNumber)
        {
            var mobile = model.MobileNumber.Trim();
            bool exists = await _context.ParentMasters.AnyAsync(p => p.MobileNumber == mobile && p.Id != id && !p.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A parent with this mobile number already exists." };

            parent.MobileNumber = mobile;
            // The number changed, so the previous OTP confirmation no longer applies.
            parent.IsMobileVerified = false;
        }

        if (model.FirstName != null) parent.FirstName = model.FirstName.Trim();
        if (model.MiddleName != null) parent.MiddleName = model.MiddleName;
        if (model.LastName != null) parent.LastName = model.LastName.Trim();
        if (model.AltMobileNumber != null) parent.AltMobileNumber = model.AltMobileNumber;
        if (model.Email != null) parent.Email = model.Email;
        if (model.Occupation != null) parent.Occupation = model.Occupation;
        if (model.AddressLine1 != null) parent.AddressLine1 = model.AddressLine1;
        if (model.AddressLine2 != null) parent.AddressLine2 = model.AddressLine2;
        if (model.CityId.HasValue) parent.CityId = model.CityId;
        if (model.StateId.HasValue) parent.StateId = model.StateId;
        if (model.PinCodeId.HasValue) parent.PinCodeId = model.PinCodeId;
        if (model.PhotoUrl != null) parent.PhotoUrl = model.PhotoUrl;
        if (model.IdProofType != null) parent.IdProofType = model.IdProofType;
        if (model.IdProofNumber != null) parent.IdProofNumber = model.IdProofNumber;
        if (model.UserId.HasValue) parent.UserId = model.UserId;
        if (model.IsWhatsAppEnabled.HasValue) parent.IsWhatsAppEnabled = model.IsWhatsAppEnabled.Value;
        if (model.IsSmsEnabled.HasValue) parent.IsSmsEnabled = model.IsSmsEnabled.Value;
        if (model.IsMobileVerified.HasValue) parent.IsMobileVerified = model.IsMobileVerified.Value;
        if (model.IsActive.HasValue) parent.IsActive = model.IsActive.Value;
        parent.UpdatedById = _jwtTokenUtility.GetUserId();
        parent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Parent updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var parent = await _context.ParentMasters.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (parent == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Parent not found." };

        var currentUserId = _jwtTokenUtility.GetUserId();

        // Soft-delete the links too, or the children keep pointing at a removed parent.
        var mappings = await _context.StudentParentMappings
            .Where(m => m.ParentId == id && !m.IsDeleted)
            .ToListAsync();

        foreach (var mapping in mappings)
        {
            mapping.IsDeleted = true;
            mapping.IsActive = false;
            mapping.UpdatedById = currentUserId;
            mapping.UpdatedAt = DateTime.UtcNow;
        }

        parent.IsDeleted = true;
        parent.IsActive = false;
        parent.UpdatedById = currentUserId;
        parent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Parent deleted successfully." };
    }

    private Task<ParentMaster?> LoadWithReferencesAsync(
        System.Linq.Expressions.Expression<Func<ParentMaster, bool>> predicate) =>
        _context.ParentMasters
            .Include(p => p.City)
            .Include(p => p.State)
            .Include(p => p.PinCode)
            .Where(p => !p.IsDeleted)
            .FirstOrDefaultAsync(predicate);

    private Task<int> CountChildrenAsync(int parentId) =>
        _context.StudentParentMappings.CountAsync(m => m.ParentId == parentId && !m.IsDeleted);

    private static ParentMasterListModel MapToListModel(ParentMaster p, int childrenCount) => new()
    {
        Id = p.Id,
        FirstName = p.FirstName,
        MiddleName = p.MiddleName,
        LastName = p.LastName,
        FullName = string.IsNullOrWhiteSpace(p.MiddleName)
            ? $"{p.FirstName} {p.LastName}"
            : $"{p.FirstName} {p.MiddleName} {p.LastName}",
        MobileNumber = p.MobileNumber,
        AltMobileNumber = p.AltMobileNumber,
        Email = p.Email,
        Occupation = p.Occupation,
        AddressLine1 = p.AddressLine1,
        AddressLine2 = p.AddressLine2,
        CityId = p.CityId,
        CityName = p.City?.CityName,
        StateId = p.StateId,
        StateName = p.State?.StateName,
        PinCodeId = p.PinCodeId,
        PinCode = p.PinCode?.PinCode,
        PhotoUrl = p.PhotoUrl,
        IdProofType = p.IdProofType,
        IdProofNumber = p.IdProofNumber,
        UserId = p.UserId,
        IsWhatsAppEnabled = p.IsWhatsAppEnabled,
        IsSmsEnabled = p.IsSmsEnabled,
        IsMobileVerified = p.IsMobileVerified,
        ChildrenCount = childrenCount,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
