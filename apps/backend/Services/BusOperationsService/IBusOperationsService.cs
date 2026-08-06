using transit_display_platform_api.Common;

namespace transit_display_platform_api.Services.BusOperationsService;

public interface IBusOperationsService
{
    /// <summary>Bus through the entry gate: resolve its route and give it the lowest free platform.</summary>
    Task<ServiceResponseDto<BoardRowModel>> GateInAsync(GateInModel model);

    Task<ServiceResponseDto<BoardRowModel>> StartBoardingAsync(int eventId);

    /// <summary>Bus out through the exit gate. Frees its platform and promotes the longest waiter.</summary>
    Task<ServiceResponseDto<BoardRowModel>> GateOutAsync(GateOutModel model);

    /// <summary>Breakdown: a reserve takes over, inheriting route and platform.</summary>
    Task<ServiceResponseDto<BoardRowModel>> ReplaceAsync(int eventId, ReplaceBusModel model);

    /// <summary>Single-step undo of the most recent platform assignment.</summary>
    Task<ServiceResponseDto<BoardRowModel>> UndoLastAssignmentAsync();

    /// <summary>Board rows for a panel. Pass a display code to scope it to one exit.</summary>
    Task<ServiceResponseDto<BoardModel>> GetBoardAsync(string? displayCode);

    Task<ServiceResponseDto<OperatorQueueModel>> GetQueueAsync();

    /// <summary>Fleet status for the current session: available, in the yard, out of service.</summary>
    Task<ServiceResponseDto<BusStatusModel>> GetBusStatusAsync();

    /// <summary>Every marked platform and whether it is free or held right now.</summary>
    Task<ServiceResponseDto<PlatformStatusModel>> GetPlatformStatusAsync();
}
