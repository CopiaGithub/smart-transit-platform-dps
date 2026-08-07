using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Data;
using transit_display_platform_api.Schema;
using transit_display_platform_api.Services.BusRouteAllocationService;
using transit_display_platform_api.Services.DispersalSessionService;

namespace transit_display_platform_api.Services.BusOperationsService;

/// <summary>
/// Gate operations for a dispersal. The compound is single-file with no overtaking:
/// platform 1 sits deepest at the boarding point and 23 nearest the exit, so an
/// arriving bus takes the lowest free platform and departures free exactly that one.
/// Mirrors apps/mobile/src/domain/allocation.ts and store/operations.slice.ts, which
/// are the agreed behaviour.
/// </summary>
public class BusOperationsService : IBusOperationsService
{
    /// <summary>
    /// How many times a gate-in re-computes its platform after losing the race to
    /// another operator. Each retry makes progress — the winner has taken one more
    /// platform — so this only needs to exceed the number of people tapping at once.
    /// Measured: with 2 attempts, 5 of 7 simultaneous entries were dropped.
    /// </summary>
    private const int MaxAssignAttempts = 10;

    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenUtility _jwtTokenUtility;
    private readonly IDispersalSessionService _sessions;
    private readonly IBusRouteAllocationService _allocations;

    public BusOperationsService(
        ApplicationDbContext context,
        IJwtTokenUtility jwtTokenUtility,
        IDispersalSessionService sessions,
        IBusRouteAllocationService allocations)
    {
        _context = context;
        _jwtTokenUtility = jwtTokenUtility;
        _sessions = sessions;
        _allocations = allocations;
    }

    // -------------------------------------------------------------------- gate in

    public async Task<ServiceResponseDto<BoardRowModel>> GateInAsync(GateInModel model)
    {
        var session = await ResolveSessionAsync(model.SessionId);
        if (session == null)
            return Fail("No dispersal session is open. Open one before recording bus movements.");

        var bus = await _context.BusesMasters
            .Include(b => b.Route)
            .FirstOrDefaultAsync(b => b.Id == model.BusId && !b.IsDeleted);
        if (bus == null)
            return Fail("The selected bus does not exist.");

        if (!bus.IsActive)
            return Fail($"Bus {bus.BusNumber} is marked inactive and cannot enter.");

        if (BusServiceState.OutOfService.Contains(bus.ServiceStatus))
            return Fail($"Bus {bus.BusNumber} is out of service ({bus.ServiceStatus})" +
                        $"{(bus.OutOfServiceReason is null ? "" : $": {bus.OutOfServiceReason}")}.");

        var alreadyLive = await _context.BoardingEvents.AnyAsync(e =>
            e.SessionId == session.Id && e.BusId == bus.Id && !e.IsDeleted
            && BoardingStatus.Live.Contains(e.Status));
        if (alreadyLive)
            return Fail($"Bus {bus.BusNumber} is already in the yard for this session.");

        // The route it is running today: an allocation override beats the standing
        // pairing, and an explicit RouteId from the operator beats both.
        int? routeId = model.RouteId
            ?? await _allocations.ResolveRouteForBusAsync(bus.Id, session.SessionDate)
            ?? bus.RouteId;

        if (model.RouteId.HasValue &&
            !await _context.RoutesMasters.AnyAsync(r => r.Id == model.RouteId && !r.IsDeleted))
            return Fail("The selected route does not exist.");

        for (int attempt = 1; attempt <= MaxAssignAttempts; attempt++)
        {
            try
            {
                var platformId = await NextFreePlatformIdAsync(session.Id);
                var now = DateTime.UtcNow;
                var currentUserId = _jwtTokenUtility.GetUserId();

                int nextQueueOrder = 1 + await _context.BoardingEvents
                    .Where(e => e.SessionId == session.Id && !e.IsDeleted)
                    .Select(e => (int?)e.QueueOrder)
                    .MaxAsync() ?? 1;

                var boardingEvent = new BoardingEvents
                {
                    SessionId = session.Id,
                    BusId = bus.Id,
                    RouteId = routeId,
                    PlatformId = platformId,
                    // A full yard is a real operating state, not an error: the bus is
                    // recorded as Waiting and picks up the next platform that frees.
                    Status = platformId.HasValue ? BoardingStatus.Arrived : BoardingStatus.Waiting,
                    QueueOrder = nextQueueOrder,
                    EnteredAt = now,
                    AssignedAt = platformId.HasValue ? now : null,
                    Notes = model.Notes,
                    CreatedById = currentUserId,
                    UpdatedById = currentUserId,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.BoardingEvents.Add(boardingEvent);
                await _context.SaveChangesAsync();

                await AuditAsync(session.Id, boardingEvent.Id, "GateIn", null,
                    platformId.HasValue ? await PlatformLabelAsync(platformId.Value) : "Waiting",
                    $"Bus {bus.BusNumber} entered.");

                return new ServiceResponseDto<BoardRowModel>
                {
                    Data = await BuildRowAsync(boardingEvent.Id),
                    Message = platformId.HasValue
                        ? $"Bus {bus.BusNumber} assigned."
                        : $"Bus {bus.BusNumber} recorded as waiting — every platform is occupied."
                };
            }
            catch (DbUpdateException ex) when (IsPlatformRace(ex) && attempt < MaxAssignAttempts)
            {
                // Another operator took the platform between our read and our write.
                // Detach the failed entity and recompute against a fresh queue.
                foreach (var entry in _context.ChangeTracker.Entries<BoardingEvents>()
                             .Where(e => e.State == EntityState.Added).ToList())
                    entry.State = EntityState.Detached;
            }
        }

        return new ServiceResponseDto<BoardRowModel>
        {
            Success = false,
            Message = "Another operator assigned that platform first. Please try again."
        };
    }

    // ------------------------------------------------------------------- boarding

    public async Task<ServiceResponseDto<BoardRowModel>> StartBoardingAsync(int eventId)
    {
        var boardingEvent = await _context.BoardingEvents
            .Include(e => e.Bus)
            .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
        if (boardingEvent == null)
            return Fail("Boarding event not found.");

        if (boardingEvent.Status != BoardingStatus.Arrived)
            return Fail($"Only a bus that has arrived can start boarding. This one is {boardingEvent.Status}.");

        boardingEvent.Status = BoardingStatus.Boarding;
        boardingEvent.UpdatedById = _jwtTokenUtility.GetUserId();
        boardingEvent.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await AuditAsync(boardingEvent.SessionId, boardingEvent.Id, "Boarding",
            BoardingStatus.Arrived, BoardingStatus.Boarding,
            $"Bus {boardingEvent.Bus?.BusNumber} started boarding.");

        return new ServiceResponseDto<BoardRowModel>
        {
            Data = await BuildRowAsync(boardingEvent.Id),
            Message = "Boarding started."
        };
    }

    // ------------------------------------------------------------------- gate out

    public async Task<ServiceResponseDto<BoardRowModel>> GateOutAsync(GateOutModel model)
    {
        if (model.EventId == null && model.BusId == null)
            return Fail("Supply either a bus or a boarding event.");

        var session = await _sessions.CurrentSessionAsync();

        var query = _context.BoardingEvents.Include(e => e.Bus).Where(e => !e.IsDeleted);
        query = model.EventId.HasValue
            ? query.Where(e => e.Id == model.EventId.Value)
            : query.Where(e => e.BusId == model.BusId!.Value
                            && BoardingStatus.Live.Contains(e.Status)
                            && (session == null || e.SessionId == session.Id));

        var boardingEvent = await query.OrderByDescending(e => e.Id).FirstOrDefaultAsync();
        if (boardingEvent == null)
            return Fail("No bus is in the yard for that selection.");

        if (!BoardingStatus.Live.Contains(boardingEvent.Status))
            return Fail($"Bus {boardingEvent.Bus?.BusNumber} is already {boardingEvent.Status}.");

        var now = DateTime.UtcNow;
        var currentUserId = _jwtTokenUtility.GetUserId();
        int? freedPlatformId = boardingEvent.PlatformId;
        var previousStatus = boardingEvent.Status;

        boardingEvent.Status = BoardingStatus.Departed;
        boardingEvent.DepartedAt = now;
        if (!string.IsNullOrWhiteSpace(model.Notes)) boardingEvent.Notes = model.Notes;
        boardingEvent.UpdatedById = currentUserId;
        boardingEvent.UpdatedAt = now;
        // PlatformId is deliberately kept so reports can still show where it stood.

        await _context.SaveChangesAsync();

        await AuditAsync(boardingEvent.SessionId, boardingEvent.Id, "GateOut",
            previousStatus, BoardingStatus.Departed,
            $"Bus {boardingEvent.Bus?.BusNumber} departed.");

        string message = $"Bus {boardingEvent.Bus?.BusNumber} departed.";

        // The freed platform goes to whoever has been waiting longest.
        if (freedPlatformId.HasValue)
        {
            var promoted = await PromoteLongestWaiterAsync(boardingEvent.SessionId, freedPlatformId.Value);
            if (promoted != null)
                message += $" Bus {promoted.Bus?.BusNumber} moved into the freed platform.";
        }

        return new ServiceResponseDto<BoardRowModel>
        {
            Data = await BuildRowAsync(boardingEvent.Id),
            Message = message
        };
    }

    /// <summary>
    /// Hands the platform a departure just freed to whoever has been waiting
    /// longest (§5.5) — but only if that platform can still be used.
    ///
    /// A platform deactivated while a bus stood on it is the case that matters:
    /// when that bus leaves, reusing its number would send children to a
    /// standing position the school has taken out of service. Deactivating a
    /// platform must keep it out of allocation from then on (§7.2), and that
    /// has to hold for promotion too, not just for a fresh gate-in. The waiting
    /// bus simply stays waiting, which is correct: no usable platform freed.
    /// </summary>
    private async Task<BoardingEvents?> PromoteLongestWaiterAsync(int sessionId, int platformId)
    {
        bool usable = await _context.PlatformsMasters
            .AnyAsync(p => p.Id == platformId && p.IsActive && !p.IsDeleted);
        if (!usable) return null;

        var waiter = await _context.BoardingEvents
            .Include(e => e.Bus)
            .Where(e => e.SessionId == sessionId && !e.IsDeleted
                     && e.Status == BoardingStatus.Waiting && e.PlatformId == null)
            .OrderBy(e => e.EnteredAt).ThenBy(e => e.Id)
            .FirstOrDefaultAsync();

        if (waiter == null) return null;

        var now = DateTime.UtcNow;
        waiter.PlatformId = platformId;
        waiter.Status = BoardingStatus.Arrived;
        waiter.AssignedAt = now;
        waiter.UpdatedById = _jwtTokenUtility.GetUserId();
        waiter.UpdatedAt = now;

        await _context.SaveChangesAsync();

        await AuditAsync(sessionId, waiter.Id, "AutoAssign", BoardingStatus.Waiting,
            await PlatformLabelAsync(platformId),
            $"Bus {waiter.Bus?.BusNumber} auto-assigned to the platform freed on departure.");

        return waiter;
    }

    // -------------------------------------------------------------------- replace

    public async Task<ServiceResponseDto<BoardRowModel>> ReplaceAsync(int eventId, ReplaceBusModel model)
    {
        var original = await _context.BoardingEvents
            .Include(e => e.Bus)
            .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);
        if (original == null)
            return Fail("Boarding event not found.");

        if (!BoardingStatus.Live.Contains(original.Status))
            return Fail($"Bus {original.Bus?.BusNumber} is already {original.Status} and cannot be replaced.");

        var reserve = await _context.BusesMasters
            .FirstOrDefaultAsync(b => b.Id == model.ReserveBusId && !b.IsDeleted);
        if (reserve == null)
            return Fail("The replacement bus does not exist.");

        if (reserve.Id == original.BusId)
            return Fail("A bus cannot replace itself.");

        if (!reserve.IsActive || BusServiceState.OutOfService.Contains(reserve.ServiceStatus))
            return Fail($"Bus {reserve.BusNumber} is not available to take over.");

        var reserveBusy = await _context.BoardingEvents.AnyAsync(e =>
            e.SessionId == original.SessionId && e.BusId == reserve.Id && !e.IsDeleted
            && BoardingStatus.Live.Contains(e.Status));
        if (reserveBusy)
            return Fail($"Bus {reserve.BusNumber} is already in the yard for this session.");

        var now = DateTime.UtcNow;
        var currentUserId = _jwtTokenUtility.GetUserId();

        // The reserve inherits route and platform so students keep watching the same
        // station number on the board — the whole point of the substitution flow.
        var replacement = new BoardingEvents
        {
            SessionId = original.SessionId,
            BusId = reserve.Id,
            RouteId = original.RouteId,
            PlatformId = original.PlatformId,
            Status = original.Status,
            QueueOrder = original.QueueOrder,
            EnteredAt = now,
            AssignedAt = original.PlatformId.HasValue ? now : null,
            ReplacesEventId = original.Id,
            Notes = model.Reason,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = now,
            UpdatedAt = now
        };

        var previousStatus = original.Status;
        original.Status = BoardingStatus.Replaced;
        original.ReplacedByBusId = reserve.Id;
        original.DepartedAt = now;
        original.UpdatedById = currentUserId;
        original.UpdatedAt = now;

        // The original must vacate before the replacement can claim the same platform,
        // or the one-bus-per-platform index rejects the pair.
        _context.BoardingEvents.Add(replacement);
        await _context.SaveChangesAsync();

        await AuditAsync(original.SessionId, replacement.Id, "Replace",
            $"Bus {original.Bus?.BusNumber} ({previousStatus})",
            $"Bus {reserve.BusNumber}",
            model.Reason ?? $"Bus {original.Bus?.BusNumber} replaced by {reserve.BusNumber}.");

        // Record the substitution against the route for the day, so the allocation
        // screens and tomorrow's standing pairing both stay truthful.
        if (original.RouteId.HasValue)
        {
            var session = await _context.Sessions.FirstAsync(s => s.Id == original.SessionId);
            await _allocations.SubstituteAsync(new SubstituteBusModel
            {
                RouteId = original.RouteId.Value,
                ReplacementBusId = reserve.Id,
                Date = session.SessionDate,
                Reason = model.Reason ?? "Replaced mid-dispersal."
            });
        }

        return new ServiceResponseDto<BoardRowModel>
        {
            Data = await BuildRowAsync(replacement.Id),
            Message = $"Bus {reserve.BusNumber} took over from {original.Bus?.BusNumber}."
        };
    }

    // ----------------------------------------------------------------------- undo

    public async Task<ServiceResponseDto<BoardRowModel>> UndoLastAssignmentAsync()
    {
        var session = await _sessions.CurrentSessionAsync();
        if (session == null)
            return Fail("No dispersal session is open.");

        // Single step, as the SOP requires, and only while the bus is merely Arrived —
        // once students are boarding, pulling the platform back is not safe.
        var last = await _context.BoardingEvents
            .Include(e => e.Bus)
            .Where(e => e.SessionId == session.Id && !e.IsDeleted
                     && e.Status == BoardingStatus.Arrived && e.AssignedAt != null)
            .OrderByDescending(e => e.AssignedAt).ThenByDescending(e => e.Id)
            .FirstOrDefaultAsync();

        if (last == null)
            return Fail("There is no recent assignment to undo.");

        var previousPlatform = last.PlatformId.HasValue
            ? await PlatformLabelAsync(last.PlatformId.Value)
            : null;

        var busNumber = last.Bus?.BusNumber;

        // Undo means "that bus never came in" — the operator tapped the wrong
        // one. Leaving the event behind as Waiting looked tidier but was wrong
        // twice over: the bus stayed on the board as present when it was not,
        // and it sat in the waiting queue with free platforms all around it,
        // because promotion only fires on a departure. Clearing the event puts
        // the bus back in the gate operator's available list, which is the only
        // state that matches what actually happened.
        //
        // Soft-deleted, not erased: the audit row below still references it, so
        // the day's trail shows the entry and the correction.
        var now = DateTime.UtcNow;
        last.IsDeleted = true;
        last.Status = BoardingStatus.Waiting;
        last.PlatformId = null;
        last.AssignedAt = null;
        last.UpdatedById = _jwtTokenUtility.GetUserId();
        last.UpdatedAt = now;

        await _context.SaveChangesAsync();

        await AuditAsync(session.Id, last.Id, "Undo", previousPlatform, "Removed",
            $"Entry for bus {busNumber} was undone; the bus is available at the gate again.");

        return new ServiceResponseDto<BoardRowModel>
        {
            // The event is gone, so there is no row to return — the console
            // re-reads the queue after every action anyway.
            Data = null,
            Message = $"Entry for bus {busNumber} undone. It can be recorded in again."
        };
    }

    // ---------------------------------------------------------------------- board

    public async Task<ServiceResponseDto<BoardModel>> GetBoardAsync(string? displayCode)
    {
        var session = await _sessions.CurrentSessionAsync();
        if (session == null)
            return new ServiceResponseDto<BoardModel>
            {
                Success = false,
                Message = "No dispersal session is open."
            };

        DisplayMaster? display = null;
        if (!string.IsNullOrWhiteSpace(displayCode))
        {
            display = await _context.DisplayMasters
                .Include(d => d.FilterByGate)
                .FirstOrDefaultAsync(d => d.DisplayCode == displayCode && !d.IsDeleted);
            if (display == null)
                return new ServiceResponseDto<BoardModel> { Success = false, Message = "Display not found." };
        }

        var rows = await RowQuery()
            .Where(e => e.SessionId == session.Id)
            .ToListAsync();

        // An indoor panel serves one student exit, so it shows only the platforms
        // nearest that exit — students at exit 1 should not scan exit 2's buses.
        if (display?.FilterByGateId is int gateId)
        {
            var platformIds = await _context.PlatformsMasters
                .Where(p => p.NearestGateId == gateId && !p.IsDeleted)
                .Select(p => p.Id)
                .ToListAsync();

            rows = rows.Where(e => e.PlatformId == null || platformIds.Contains(e.PlatformId.Value)).ToList();
        }

        var take = display?.VisibleRowCount ?? int.MaxValue;

        var board = new BoardModel
        {
            SessionId = session.Id,
            SessionDate = session.SessionDate,
            ShiftName = session.ShiftName,
            DisplayCode = display?.DisplayCode,
            DisplayName = display?.DisplayName,
            FilteredByGateName = display?.FilterByGate?.GateName,
            GeneratedAt = DateTime.UtcNow,
            Rows = rows
                .Select(ToRow)
                .OrderBy(r => BoardingStatus.Rank(r.Status))
                .ThenBy(r => r.PlatformNumber ?? int.MaxValue)
                .ThenBy(r => r.QueueOrder)
                .Take(take)
                .ToList()
        };

        return new ServiceResponseDto<BoardModel>
        {
            Data = board,
            TotalRecords = board.Rows.Count,
            Message = "Board fetched successfully."
        };
    }

    // ---------------------------------------------------------------------- queue

    public async Task<ServiceResponseDto<OperatorQueueModel>> GetQueueAsync()
    {
        var session = await _sessions.CurrentSessionAsync();
        if (session == null)
            return new ServiceResponseDto<OperatorQueueModel>
            {
                Success = false,
                Message = "No dispersal session is open."
            };

        var events = await RowQuery().Where(e => e.SessionId == session.Id).ToListAsync();

        var platforms = await ActivePlatformsAsync();

        // Every platform a live event is holding, including ones since
        // deactivated — a bus parked on one still blocks it from being handed
        // out again, so this is the right set for choosing the next free.
        var occupied = events
            .Where(e => BoardingStatus.Occupying.Contains(e.Status) && e.PlatformId.HasValue)
            .Select(e => e.PlatformId!.Value)
            .ToHashSet();

        var nextFree = platforms.FirstOrDefault(p => !occupied.Contains(p.Id));

        var busyBusIds = events
            .Where(e => BoardingStatus.Live.Contains(e.Status))
            .Select(e => e.BusId)
            .ToHashSet();

        // A bus under maintenance or broken down must not be offered at the gate, even
        // though it is still on the fleet roster.
        var buses = await _context.BusesMasters
            .Include(b => b.Route)
            .Where(b => !b.IsDeleted && b.IsActive
                     && !BusServiceState.OutOfService.Contains(b.ServiceStatus))
            .OrderBy(b => b.BusNumber)
            .ToListAsync();

        var available = buses
            .Where(b => !busyBusIds.Contains(b.Id))
            .Select(b => new AvailableBusModel
            {
                BusId = b.Id,
                BusNumber = b.BusNumber,
                BusType = b.BusType,
                Capacity = b.Capacity,
                DriverName = b.DriverName,
                DriverPhone = b.DriverPhone,
                RouteId = b.RouteId,
                RouteName = b.Route?.RouteName
            })
            .ToList();

        var undoable = events
            .Where(e => e.Status == BoardingStatus.Arrived && e.AssignedAt != null)
            .OrderByDescending(e => e.AssignedAt).ThenByDescending(e => e.Id)
            .FirstOrDefault();

        var model = new OperatorQueueModel
        {
            SessionId = session.Id,
            PlatformCount = platforms.Count,
            // Counted against the active platforms only, so this can never
            // exceed PlatformCount. Counting every held platform instead would
            // report an impossible "22 of 21" the moment a bus sat on a
            // platform that was later deactivated — and it would disagree with
            // /platforms/status, which counts the same way.
            OccupiedCount = platforms.Count(p => occupied.Contains(p.Id)),
            NextFreePlatformNumber = nextFree?.PlatformNumber,
            YardFull = nextFree == null,
            Yard = events.Where(e => BoardingStatus.Occupying.Contains(e.Status))
                         .Select(ToRow)
                         .OrderBy(r => r.PlatformNumber ?? int.MaxValue)
                         .ToList(),
            Waiting = events.Where(e => e.Status == BoardingStatus.Waiting)
                            .Select(ToRow)
                            .OrderBy(r => r.EnteredAt)
                            .ToList(),
            AvailableBuses = available.Where(b => b.BusType != BusKind.Reserve).ToList(),
            AvailableReserves = available.Where(b => b.BusType == BusKind.Reserve).ToList(),
            UndoableEventId = undoable?.Id
        };

        return new ServiceResponseDto<OperatorQueueModel> { Data = model, Message = "Queue fetched successfully." };
    }

    // ------------------------------------------------------------- platform status

    public async Task<ServiceResponseDto<PlatformStatusModel>> GetPlatformStatusAsync()
    {
        var session = await _sessions.CurrentSessionAsync();
        if (session == null)
            return new ServiceResponseDto<PlatformStatusModel>
            {
                Success = false,
                Message = "No dispersal session is open."
            };

        var platforms = await ActivePlatformsAsync();

        var occupantByPlatform = (await RowQuery()
                .Where(e => e.SessionId == session.Id
                         && BoardingStatus.Occupying.Contains(e.Status)
                         && e.PlatformId != null)
                .ToListAsync())
            .ToDictionary(e => e.PlatformId!.Value);

        var slots = platforms.Select(p =>
        {
            occupantByPlatform.TryGetValue(p.Id, out var occ);
            return new PlatformSlotModel
            {
                PlatformId = p.Id,
                PlatformNumber = p.PlatformNumber,
                PlatformName = p.PlatformName,
                NearestGateId = p.NearestGateId,
                IsOccupied = occ != null,
                EventId = occ?.Id,
                BusId = occ?.BusId,
                BusNumber = occ?.Bus?.BusNumber,
                RouteName = occ?.Route?.RouteName,
                Status = occ?.Status,
                AssignedAt = occ?.AssignedAt
            };
        }).ToList();

        var nextFree = slots.FirstOrDefault(s => !s.IsOccupied);

        var model = new PlatformStatusModel
        {
            SessionId = session.Id,
            PlatformCount = slots.Count,
            OccupiedCount = slots.Count(s => s.IsOccupied),
            AvailableCount = slots.Count(s => !s.IsOccupied),
            NextFreePlatformNumber = nextFree?.PlatformNumber,
            YardFull = nextFree == null,
            Platforms = slots
        };

        return new ServiceResponseDto<PlatformStatusModel>
        {
            Data = model,
            TotalRecords = slots.Count,
            Message = "Platform status fetched successfully."
        };
    }

    // ------------------------------------------------------------------ bus status

    public async Task<ServiceResponseDto<BusStatusModel>> GetBusStatusAsync()
    {
        var session = await _sessions.CurrentSessionAsync();

        var buses = await _context.BusesMasters
            .Include(b => b.Route)
            .Where(b => !b.IsDeleted)
            .OrderBy(b => b.BusNumber)
            .ToListAsync();

        // Latest event per bus in this session (highest Id wins).
        var latestByBus = new Dictionary<int, BoardingEvents>();
        if (session != null)
        {
            foreach (var e in await RowQuery()
                         .Where(e => e.SessionId == session.Id)
                         .OrderByDescending(e => e.Id)
                         .ToListAsync())
                latestByBus.TryAdd(e.BusId, e);
        }

        var rows = buses.Select(b =>
        {
            latestByBus.TryGetValue(b.Id, out var ev);
            return new BusStatusRowModel
            {
                BusId = b.Id,
                BusNumber = b.BusNumber,
                BusType = b.BusType,
                IsActive = b.IsActive,
                ServiceStatus = b.ServiceStatus,
                OutOfServiceReason = b.OutOfServiceReason,
                Availability = ResolveBusAvailability(b, ev),
                Capacity = b.Capacity,
                DriverName = b.DriverName,
                DriverPhone = b.DriverPhone,
                RouteId = b.RouteId,
                RouteName = b.Route?.RouteName,
                CurrentEventId = ev?.Id,
                CurrentStatus = ev?.Status,
                CurrentPlatformNumber = ev?.Platform?.PlatformNumber
            };
        }).ToList();

        var model = new BusStatusModel
        {
            SessionId = session?.Id,
            TotalBuses = rows.Count,
            AvailableCount = rows.Count(r => r.Availability == BusAvailability.Available),
            InYardCount = rows.Count(r =>
                r.Availability is BusAvailability.InYard or BusAvailability.Waiting),
            OutOfServiceCount = rows.Count(r => r.Availability == BusAvailability.OutOfService),
            Buses = rows
        };

        return new ServiceResponseDto<BusStatusModel>
        {
            Data = model,
            TotalRecords = rows.Count,
            Message = "Bus status fetched successfully."
        };
    }

    /// <summary>
    /// Folds the master-data flags and the live boarding event into one operational
    /// state. A live event beats the roster flags — a bus that broke down mid-run is
    /// still Replaced/Departed for the board, not OutOfService.
    /// </summary>
    private static string ResolveBusAvailability(BusesMaster b, BoardingEvents? ev)
    {
        if (!b.IsActive) return BusAvailability.Inactive;

        if (ev != null)
        {
            if (ev.Status == BoardingStatus.Waiting) return BusAvailability.Waiting;
            if (BoardingStatus.Occupying.Contains(ev.Status)) return BusAvailability.InYard;
            if (ev.Status == BoardingStatus.Departed) return BusAvailability.Departed;
            if (ev.Status == BoardingStatus.Replaced) return BusAvailability.Replaced;
        }

        if (BusServiceState.OutOfService.Contains(b.ServiceStatus)) return BusAvailability.OutOfService;
        return BusAvailability.Available;
    }

    // -------------------------------------------------------------------- helpers

    private async Task<Sessions?> ResolveSessionAsync(int? sessionId)
    {
        if (sessionId == null)
            return await _sessions.CurrentSessionAsync();

        return await _context.Sessions.FirstOrDefaultAsync(s =>
            s.Id == sessionId && !s.IsDeleted && s.Status == DispersalSessionService.DispersalSessionService.Open);
    }

    private Task<List<PlatformsMaster>> ActivePlatformsAsync() =>
        _context.PlatformsMasters
            .Where(p => !p.IsDeleted && p.IsActive)
            .OrderBy(p => p.PlatformNumber)
            .ToListAsync();

    /// <summary>
    /// Lowest-numbered platform not currently held. Returns null when the yard is
    /// full — more buses than marked platforms is a real operating state.
    /// </summary>
    private async Task<int?> NextFreePlatformIdAsync(int sessionId)
    {
        var platforms = await ActivePlatformsAsync();

        var occupied = await _context.BoardingEvents
            .Where(e => e.SessionId == sessionId && !e.IsDeleted
                     && e.PlatformId != null
                     && BoardingStatus.Occupying.Contains(e.Status))
            .Select(e => e.PlatformId!.Value)
            .ToListAsync();

        var taken = occupied.ToHashSet();
        return platforms.FirstOrDefault(p => !taken.Contains(p.Id))?.Id;
    }

    /// <summary>True when the write failed because the one-bus-per-platform index fired.</summary>
    private static bool IsPlatformRace(DbUpdateException ex) =>
        ex.InnerException?.Message.Contains("UX_boarding_events_Session_Platform") == true;

    private async Task<string> PlatformLabelAsync(int platformId)
    {
        var platform = await _context.PlatformsMasters.FirstOrDefaultAsync(p => p.Id == platformId);
        return platform == null ? $"Platform {platformId}" : $"Platform {platform.PlatformNumber}";
    }

    private IQueryable<BoardingEvents> RowQuery() =>
        _context.BoardingEvents
            .Include(e => e.Bus)
            .Include(e => e.Route)
            .Include(e => e.Platform)
            .Include(e => e.ReplacedByBus)
            .Where(e => !e.IsDeleted);

    private async Task<BoardRowModel> BuildRowAsync(int eventId) =>
        ToRow(await RowQuery().FirstAsync(e => e.Id == eventId));

    private static BoardRowModel ToRow(BoardingEvents e) => new()
    {
        EventId = e.Id,
        BusId = e.BusId,
        BusNumber = e.Bus?.BusNumber ?? string.Empty,
        RouteId = e.RouteId,
        RouteName = e.Route?.RouteName,
        LedDisplayName = e.Route?.LedDisplayName ?? e.Route?.RouteName,
        PlatformId = e.PlatformId,
        PlatformNumber = e.Platform?.PlatformNumber,
        PlatformName = e.Platform?.PlatformName,
        Status = e.Status,
        QueueOrder = e.QueueOrder,
        EnteredAt = e.EnteredAt,
        AssignedAt = e.AssignedAt,
        DepartedAt = e.DepartedAt,
        ReplacedByBusNumber = e.ReplacedByBus?.BusNumber
    };

    private async Task AuditAsync(
        int sessionId, int? eventId, string actionType,
        string? previousValue, string? newValue, string details)
    {
        var claims = _jwtTokenUtility.GetCurrentUserClaims();
        var currentUserId = _jwtTokenUtility.GetUserId();

        _context.AuditLogs.Add(new AuditLog
        {
            SessionId = sessionId,
            BoardingEventId = eventId,
            RoleId = claims?.RoleId,
            ActorUserId = currentUserId,
            ActorName = claims?.Username,
            ActionType = actionType,
            PreviousValue = previousValue,
            NewValue = newValue,
            Details = details,
            CreatedById = currentUserId,
            UpdatedById = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    private static ServiceResponseDto<BoardRowModel> Fail(string message) =>
        new() { Success = false, Message = message };
}
