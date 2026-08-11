using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;
using transit_display_platform_api.Services.BusRouteAllocationService;

namespace transit_display_platform_api.Services.StudentMasterService;

/// <summary>
/// A student is enrolled on a <em>route</em>, never on a bus. Which bus serves that
/// route is the allocation's business and changes whenever a reserve substitutes,
/// so BusId/BusNumber are resolved on read rather than stored per child — otherwise
/// every substitution would mean rewriting every rider's row, which nothing does.
/// </summary>
public class StudentMasterService : IStudentMasterService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;
    private readonly IBusRouteAllocationService _allocations;
    private readonly ISchoolClock _clock;

    public StudentMasterService(
        ApplicationDbContext context,
        IJwtTokenUtility jwtTokenUtility,
        IBusRouteAllocationService allocations,
        ISchoolClock clock)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _allocations = allocations;
        _clock = clock;
    }

    public async Task<ServiceResponseDto<PagedResult<StudentMasterListModel>>> GetAllAsync(
        PaginationFilterDto filter,
        int? academicYearId = null,
        string? grade = null,
        string? division = null,
        int? busId = null,
        int? exitGateId = null,
        bool? status = null,
        int? classTeacherId = null)
    {
        var (pageNumber, pageSize) = filter.Normalize();

        var query = BaseQuery();

        bool? activeFilter = status ?? filter.IsActive ?? true;
        if (activeFilter.HasValue)
            query = query.Where(s => s.IsActive == activeFilter.Value);

        if (academicYearId.HasValue) query = query.Where(s => s.AcademicYearId == academicYearId.Value);
        if (!string.IsNullOrWhiteSpace(grade)) query = query.Where(s => s.Grade == grade);
        if (!string.IsNullOrWhiteSpace(division)) query = query.Where(s => s.Division == division);
        if (classTeacherId.HasValue) query = query.Where(s => s.ClassTeacherId == classTeacherId.Value);
        if (busId.HasValue)
        {
            // "Who rides bus 12?" is now answered through the routes that bus is
            // running today, since the child is enrolled on the route, not the bus.
            var routeIds = await _allocations.ResolveRoutesForBusAsync(busId.Value, _clock.Today);
            query = routeIds.Count == 0
                ? query.Where(_ => false)
                : query.Where(s => s.UsesTransport && s.RouteId != null && routeIds.Contains(s.RouteId.Value));
        }

        if (exitGateId.HasValue) query = query.Where(s => s.ExitGateId == exitGateId.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            query = query.Where(s =>
                s.AdmissionNumber.Contains(term) ||
                s.FirstName.Contains(term) ||
                s.LastName.Contains(term));
        }

        int totalRecords = await query.CountAsync();

        query = (filter.SortBy?.ToLowerInvariant()) switch
        {
            "admissionnumber" => filter.Descending ? query.OrderByDescending(s => s.AdmissionNumber) : query.OrderBy(s => s.AdmissionNumber),
            "class" => filter.Descending
                ? query.OrderByDescending(s => s.Grade).ThenByDescending(s => s.Division)
                : query.OrderBy(s => s.Grade).ThenBy(s => s.Division),
            "createdat" => filter.Descending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => filter.Descending
                ? query.OrderByDescending(s => s.FirstName).ThenByDescending(s => s.LastName)
                : query.OrderBy(s => s.FirstName).ThenBy(s => s.LastName),
        };

        var entities = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = await MapManyAsync(entities);

        return new ServiceResponseDto<PagedResult<StudentMasterListModel>>
        {
            Data = new PagedResult<StudentMasterListModel>
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = pageNumber,
                PageSize = pageSize
            },
            TotalRecords = totalRecords,
            Message = "Students fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<StudentMasterListModel>> GetByIdAsync(int id)
    {
        var student = await BaseQuery().FirstOrDefaultAsync(s => s.Id == id);
        if (student == null)
            return new ServiceResponseDto<StudentMasterListModel> { Success = false, Message = "Student not found." };

        var mapped = await MapManyAsync(new List<StudentMaster> { student });
        return new ServiceResponseDto<StudentMasterListModel> { Data = mapped[0] };
    }

    /// <summary>Lookup for the RFID phase — a card scan resolves to a student.</summary>
    public async Task<ServiceResponseDto<StudentMasterListModel>> GetByRfidTagAsync(string rfidTag)
    {
        if (string.IsNullOrWhiteSpace(rfidTag))
            return new ServiceResponseDto<StudentMasterListModel> { Success = false, Message = "RFID tag is required." };

        var tag = rfidTag.Trim();
        var student = await BaseQuery().FirstOrDefaultAsync(s => s.RfidTag == tag);
        if (student == null)
            return new ServiceResponseDto<StudentMasterListModel> { Success = false, Message = "No student is linked to this RFID tag." };

        var mapped = await MapManyAsync(new List<StudentMaster> { student });
        return new ServiceResponseDto<StudentMasterListModel> { Data = mapped[0] };
    }

    public async Task<ServiceResponseDto<List<StudentParentModel>>> GetParentsAsync(int id)
    {
        bool exists = await _context.StudentMasters.AnyAsync(s => s.Id == id && !s.IsDeleted);
        if (!exists)
            return new ServiceResponseDto<List<StudentParentModel>> { Success = false, Message = "Student not found." };

        var parents = await _context.StudentParentMappings
            .Where(m => m.StudentId == id && !m.IsDeleted)
            .Include(m => m.Parent)
            .Where(m => m.Parent != null && !m.Parent.IsDeleted)
            .OrderByDescending(m => m.IsPrimaryContact)
            .ThenBy(m => m.ContactPriority)
            .Select(m => new StudentParentModel
            {
                MappingId = m.Id,
                ParentId = m.ParentId,
                ParentName = m.Parent!.FirstName + " " + m.Parent.LastName,
                MobileNumber = m.Parent.MobileNumber,
                Email = m.Parent.Email,
                Relation = m.Relation,
                IsPrimaryContact = m.IsPrimaryContact,
                IsEmergencyContact = m.IsEmergencyContact,
                IsAuthorisedForPickup = m.IsAuthorisedForPickup,
                ReceivesNotifications = m.ReceivesNotifications,
                ContactPriority = m.ContactPriority
            })
            .ToListAsync();

        return new ServiceResponseDto<List<StudentParentModel>>
        {
            Data = parents,
            TotalRecords = parents.Count,
            Message = "Parents fetched successfully."
        };
    }

    public async Task<ServiceResponseDto<StudentMasterListModel>> CreateAsync(StudentMasterCreateModel model)
    {
        if (string.IsNullOrWhiteSpace(model.AdmissionNumber))
            return Fail("Admission number is required.");

        if (string.IsNullOrWhiteSpace(model.FirstName) || string.IsNullOrWhiteSpace(model.LastName))
            return Fail("First name and last name are required.");

        if (string.IsNullOrWhiteSpace(model.Grade) || string.IsNullOrWhiteSpace(model.Division))
            return Fail("Grade and division are required.");

        // Fall back to the current year so callers need not know its id.
        int? academicYearId = model.AcademicYearId
            ?? (await _context.AcademicYearMasters.FirstOrDefaultAsync(a => a.IsCurrent && !a.IsDeleted))?.Id;

        if (academicYearId == null)
            return Fail("No academic year was supplied and no current academic year is set.");

        var admissionNumber = model.AdmissionNumber.Trim();
        bool exists = await _context.StudentMasters
            .AnyAsync(s => s.AdmissionNumber == admissionNumber && s.AcademicYearId == academicYearId && !s.IsDeleted);
        if (exists)
            return Fail("A student with this admission number already exists for that academic year.");

        var validationError = await ValidateReferencesAsync(model.ClassTeacherId, model.RouteId, model.ExitGateId, academicYearId);
        if (validationError != null)
            return Fail(validationError);

        bool usesTransport = model.UsesTransport ?? true;

        // A tag on a child who is not on transport is discarded below, so do not
        // reject the create over a clash with a value that will never be stored.
        var rfidTag = usesTransport && !string.IsNullOrWhiteSpace(model.RfidTag)
            ? model.RfidTag.Trim()
            : null;
        if (rfidTag != null && await _context.StudentMasters.AnyAsync(s => s.RfidTag == rfidTag && !s.IsDeleted))
            return Fail("This RFID tag is already assigned to another student.");

        var currentUserId = _jwtTokenUtility.GetUserId();
        var student = new StudentMaster
        {
            AdmissionNumber = admissionNumber,
            FirstName = model.FirstName.Trim(),
            MiddleName = model.MiddleName,
            LastName = model.LastName.Trim(),
            Grade = model.Grade.Trim(),
            Division = model.Division.Trim(),
            AcademicYearId = academicYearId.Value,
            ClassTeacherId = model.ClassTeacherId,
            RouteId = model.RouteId,
            ExitGateId = model.ExitGateId,
            PhotoUrl = model.PhotoUrl,
            PickupStop = model.PickupStop,
            DropStop = model.DropStop,
            RfidTag = rfidTag,
            UsesTransport = usesTransport,
            IsActive = model.IsActive ?? true,
            IsDeleted = false,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        ClearTransportIfUnused(student);

        _context.StudentMasters.Add(student);
        await _context.SaveChangesAsync();

        var saved = await BaseQuery().FirstAsync(s => s.Id == student.Id);
        var mapped = await MapManyAsync(new List<StudentMaster> { saved });

        return new ServiceResponseDto<StudentMasterListModel>
        {
            Data = mapped[0],
            Message = "Student created successfully."
        };
    }

    public async Task<ServiceResponseDto<bool>> UpdateAsync(int id, StudentMasterUpdateModel model)
    {
        var student = await _context.StudentMasters.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (student == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Student not found." };

        int academicYearId = model.AcademicYearId ?? student.AcademicYearId;

        if (!string.IsNullOrWhiteSpace(model.AdmissionNumber) || model.AcademicYearId.HasValue)
        {
            var admissionNumber = model.AdmissionNumber?.Trim() ?? student.AdmissionNumber;
            bool exists = await _context.StudentMasters.AnyAsync(s =>
                s.AdmissionNumber == admissionNumber && s.AcademicYearId == academicYearId && s.Id != id && !s.IsDeleted);
            if (exists)
                return new ServiceResponseDto<bool> { Success = false, Message = "A student with this admission number already exists for that academic year." };

            student.AdmissionNumber = admissionNumber;
        }

        var validationError = await ValidateReferencesAsync(
            model.ClassTeacherId, model.RouteId, model.ExitGateId,
            model.AcademicYearId.HasValue ? academicYearId : null);
        if (validationError != null)
            return new ServiceResponseDto<bool> { Success = false, Message = validationError };

        // What the record will say once this patch is applied — the flag may be
        // absent, in which case the stored one still governs.
        bool usesTransport = model.UsesTransport ?? student.UsesTransport;

        if (usesTransport && model.RfidTag != null)
        {
            var rfidTag = string.IsNullOrWhiteSpace(model.RfidTag) ? null : model.RfidTag.Trim();
            if (rfidTag != null && await _context.StudentMasters.AnyAsync(s => s.RfidTag == rfidTag && s.Id != id && !s.IsDeleted))
                return new ServiceResponseDto<bool> { Success = false, Message = "This RFID tag is already assigned to another student." };

            student.RfidTag = rfidTag;
        }

        if (model.FirstName != null) student.FirstName = model.FirstName.Trim();
        if (model.MiddleName != null) student.MiddleName = model.MiddleName;
        if (model.LastName != null) student.LastName = model.LastName.Trim();
        if (model.Grade != null) student.Grade = model.Grade.Trim();
        if (model.Division != null) student.Division = model.Division.Trim();
        if (model.AcademicYearId.HasValue) student.AcademicYearId = academicYearId;
        if (model.ClassTeacherId.HasValue) student.ClassTeacherId = model.ClassTeacherId;
        if (model.RouteId.HasValue) student.RouteId = model.RouteId;
        if (model.ExitGateId.HasValue) student.ExitGateId = model.ExitGateId;
        if (model.PhotoUrl != null) student.PhotoUrl = model.PhotoUrl;
        if (model.PickupStop != null) student.PickupStop = model.PickupStop;
        if (model.DropStop != null) student.DropStop = model.DropStop;
        student.UsesTransport = usesTransport;
        if (model.IsActive.HasValue) student.IsActive = model.IsActive.Value;

        ClearTransportIfUnused(student);

        student.UpdatedById = _jwtTokenUtility.GetUserId();
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Student updated successfully." };
    }

    public async Task<ServiceResponseDto<bool>> DeleteAsync(int id)
    {
        var student = await _context.StudentMasters.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (student == null)
            return new ServiceResponseDto<bool> { Success = false, Message = "Student not found." };

        var currentUserId = _jwtTokenUtility.GetUserId();

        // Soft-delete the parent links so no orphaned mapping survives the student.
        var mappings = await _context.StudentParentMappings
            .Where(m => m.StudentId == id && !m.IsDeleted)
            .ToListAsync();

        foreach (var mapping in mappings)
        {
            mapping.IsDeleted = true;
            mapping.IsActive = false;
            mapping.UpdatedById = currentUserId;
            mapping.UpdatedAt = DateTime.UtcNow;
        }

        student.IsDeleted = true;
        student.IsActive = false;
        student.UpdatedById = currentUserId;
        student.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ServiceResponseDto<bool> { Data = true, Message = "Student deleted successfully." };
    }

    private IQueryable<StudentMaster> BaseQuery() =>
        _context.StudentMasters
            .Include(s => s.AcademicYear)
            .Include(s => s.ClassTeacher)
            .Include(s => s.Route)
            .Include(s => s.ExitGate)
            .Where(s => !s.IsDeleted);

    /// <summary>
    /// A child who does not use school transport has no route, exit gate, stops or
    /// tag — and must not keep the ones they had, or the student list goes on
    /// showing a bus for a child who walks home.
    ///
    /// This has to live here rather than in the caller. Update is PATCH-shaped: a
    /// null field means "leave alone", so no client can express "clear this", and
    /// turning the flag off is the only signal there is. Applied after the patch so
    /// it holds however the record got into this state — including a record already
    /// carrying stale values from before this rule existed.
    ///
    /// BusId goes too. It is a legacy column nothing reads any more (the bus is
    /// resolved from the route), but stale is stale.
    /// </summary>
    private static void ClearTransportIfUnused(StudentMaster student)
    {
        if (student.UsesTransport)
            return;

        student.RouteId = null;
        student.ExitGateId = null;
        student.PickupStop = null;
        student.DropStop = null;
        student.RfidTag = null;
        student.BusId = null;
    }

    private async Task<string?> ValidateReferencesAsync(
        int? classTeacherId, int? routeId, int? exitGateId, int? academicYearId)
    {
        if (academicYearId.HasValue && !await _context.AcademicYearMasters.AnyAsync(a => a.Id == academicYearId && !a.IsDeleted))
            return "The selected academic year does not exist.";

        if (classTeacherId.HasValue && !await _context.UserMasters.AnyAsync(u => u.Id == classTeacherId && !u.IsDeleted))
            return "The selected class teacher does not exist.";

        if (routeId.HasValue && !await _context.RoutesMasters.AnyAsync(r => r.Id == routeId && !r.IsDeleted))
            return "The selected route does not exist.";

        if (exitGateId.HasValue && !await _context.GateMasters.AnyAsync(g => g.Id == exitGateId && !g.IsDeleted))
            return "The selected exit gate does not exist.";

        return null;
    }

    /// <summary>
    /// Resolves parent counts, the primary contact, and today's bus for a page of
    /// students in a handful of queries rather than a handful per row.
    /// </summary>
    private async Task<List<StudentMasterListModel>> MapManyAsync(List<StudentMaster> students)
    {
        var ids = students.Select(s => s.Id).ToList();

        var mappings = await _context.StudentParentMappings
            .Where(m => ids.Contains(m.StudentId) && !m.IsDeleted)
            .Include(m => m.Parent)
            .Select(m => new { m.StudentId, m.IsPrimaryContact, ParentName = m.Parent!.FirstName + " " + m.Parent.LastName, m.Parent.MobileNumber })
            .ToListAsync();

        var grouped = mappings.GroupBy(m => m.StudentId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // A child who is not on transport has no bus even if a stale route lingers.
        var routeIds = students
            .Where(s => s.UsesTransport && s.RouteId.HasValue)
            .Select(s => s.RouteId!.Value)
            .Distinct()
            .ToList();

        var busByRoute = await _allocations.ResolveBusesForRoutesAsync(routeIds, _clock.Today);
        var busIds = busByRoute.Values.Distinct().ToList();
        var busNumbers = busIds.Count == 0
            ? new Dictionary<int, string>()
            : await _context.BusesMasters
                .Where(b => busIds.Contains(b.Id) && !b.IsDeleted)
                .ToDictionaryAsync(b => b.Id, b => b.BusNumber);

        return students.Select(s =>
        {
            grouped.TryGetValue(s.Id, out var links);
            var primary = links?.FirstOrDefault(l => l.IsPrimaryContact);

            int? busId = s.UsesTransport && s.RouteId.HasValue
                         && busByRoute.TryGetValue(s.RouteId.Value, out var resolvedBusId)
                ? resolvedBusId
                : null;

            return new StudentMasterListModel
            {
                Id = s.Id,
                AdmissionNumber = s.AdmissionNumber,
                FirstName = s.FirstName,
                MiddleName = s.MiddleName,
                LastName = s.LastName,
                FullName = string.IsNullOrWhiteSpace(s.MiddleName)
                    ? $"{s.FirstName} {s.LastName}"
                    : $"{s.FirstName} {s.MiddleName} {s.LastName}",
                Grade = s.Grade,
                Division = s.Division,
                Class = $"{s.Grade}-{s.Division}",
                AcademicYearId = s.AcademicYearId,
                AcademicYearName = s.AcademicYear?.YearName,
                ClassTeacherId = s.ClassTeacherId,
                ClassTeacherName = s.ClassTeacher?.Name,
                BusId = busId,
                BusNumber = busId.HasValue && busNumbers.TryGetValue(busId.Value, out var busNumber)
                    ? busNumber
                    : null,
                RouteId = s.RouteId,
                RouteName = s.Route?.RouteName,
                ExitGateId = s.ExitGateId,
                ExitGateName = s.ExitGate?.GateName,
                PhotoUrl = s.PhotoUrl,
                PickupStop = s.PickupStop,
                DropStop = s.DropStop,
                RfidTag = s.RfidTag,
                UsesTransport = s.UsesTransport,
                ParentCount = links?.Count ?? 0,
                PrimaryContactName = primary?.ParentName,
                PrimaryContactMobile = primary?.MobileNumber,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            };
        }).ToList();
    }

    private static ServiceResponseDto<StudentMasterListModel> Fail(string message) =>
        new() { Success = false, Message = message };
}
