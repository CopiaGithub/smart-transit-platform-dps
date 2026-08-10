namespace transit_display_platform_api.Common;

/// <summary>
/// Role names exactly as role_master stores them, and the groupings the
/// <c>[Authorize]</c> attributes ask for.
///
/// The names are here rather than typed into each attribute because a role
/// string that does not match the seeded row fails silently — the endpoint
/// simply answers 403 forever, and nothing points at the typo.
/// </summary>
public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Teacher = "Teacher";
    public const string Parent = "Parent";
    public const string Gate6Operator = "Gate 6 Operator";
    public const string Gate1Operator = "Gate 1 Operator";

    /// <summary>
    /// Either gate's operator, plus admin.
    ///
    /// Entry and exit used to be separate permissions, on the reasoning that a
    /// guard marking the wrong direction would corrupt the platform queue. In
    /// practice it corrupted the shift instead: when the Gate 6 guard goes home
    /// sick, whoever covers the post cannot record a single bus, and there is no
    /// way to move them without an admin editing the user record.
    ///
    /// The queue is protected by the service, not by the role — GateOut only
    /// acts on a live boarding event and refuses a bus that has already
    /// departed, GateIn refuses one that is already inside, and every write is
    /// audited with the user who made it. So the direction is now the guard's
    /// choice on screen, and the record still says who chose it.
    /// </summary>
    public const string AnyGateOperator = $"{Admin},{Gate6Operator},{Gate1Operator}";

    /// <summary>Boarding is started by a teacher at the platform or by gate staff.</summary>
    public const string AnyGateOperatorOrTeacher = $"{AnyGateOperator},{Teacher}";
}
