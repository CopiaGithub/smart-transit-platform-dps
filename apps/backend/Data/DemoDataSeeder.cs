using Microsoft.EntityFrameworkCore;
using transit_display_platform_api.Common;
using transit_display_platform_api.Schema;

namespace transit_display_platform_api.Data;

/// <summary>
/// Populates every master table with a working DPS Nerul dataset.
///
/// Idempotent by design: each row is looked up by its natural key (route code, bus
/// number, admission number …) and only inserted when absent, so it is safe to run
/// against a database that already holds data and safe to run repeatedly. It never
/// updates or deletes an existing row.
///
/// Gated behind <c>Seed:EnableDemoData</c>. Passwords come from
/// <c>Seed:AdminPassword</c> and are BCrypt-hashed at seed time — no hash is ever
/// committed to source.
/// </summary>
public static class DemoDataSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext db, IConfiguration configuration, ILogger logger)
    {
        if (!configuration.GetValue<bool>("Seed:EnableDemoData"))
            return;

        logger.LogInformation("Demo data seeding enabled — checking master tables.");

        var geography = await SeedGeographyAsync(db);
        var roles = await SeedRolesAsync(db);
        await SeedMenusAsync(db, roles);
        var users = await SeedUsersAsync(db, configuration, roles, logger);
        var routes = await SeedRoutesAsync(db);
        var buses = await SeedBusesAsync(db, routes);
        await SeedPlatformsAsync(db);
        var students = await SeedStudentsAndParentsAsync(db, geography, users, routes, buses);
        await SeedAllocationsAsync(db, routes, buses);
        await SeedDispersalDemoAsync(db, buses, routes, users, roles);

        logger.LogInformation("Demo data seeding complete ({StudentCount} students present).", students);
    }

    // ---------------------------------------------------------------- geography

    private sealed record GeographyIds(int CountryId, int RegionId, int StateId, int CityId, int PinCodeId);

    private static async Task<GeographyIds> SeedGeographyAsync(ApplicationDbContext db)
    {
        var country = await GetOrAddAsync(db, db.CountryMasters,
            c => c.CountryCode == "IN",
            () => new CountryMaster { CountryCode = "IN", CountryName = "India" });

        var region = await GetOrAddAsync(db, db.RegionMasters,
            r => r.RegionCode == "WEST",
            () => new RegionMaster { RegionCode = "WEST", RegionName = "West India", CountryId = country.Id });

        var state = await GetOrAddAsync(db, db.StateMasters,
            s => s.StateCode == "MH",
            () => new StateMaster
            {
                StateCode = "MH", StateName = "Maharashtra",
                CountryId = country.Id, RegionId = region.Id
            });

        var city = await GetOrAddAsync(db, db.CityMasters,
            c => c.CityCode == "NVM",
            () => new CityMaster
            {
                CityCode = "NVM", CityName = "Navi Mumbai",
                StateId = state.Id, RegionId = region.Id
            });

        // Pin codes covering the five routes in the brief.
        foreach (var pin in new[] { "400706", "400703", "400614", "400705", "410210" })
        {
            await GetOrAddAsync(db, db.PinCodeMasters,
                p => p.PinCode == pin,
                () => new PinCodeMaster { PinCode = pin, CityId = city.Id });
        }

        var nerul = await db.PinCodeMasters.FirstAsync(p => p.PinCode == "400706");

        return new GeographyIds(country.Id, region.Id, state.Id, city.Id, nerul.Id);
    }

    // -------------------------------------------------------------------- roles

    private static async Task<Dictionary<string, int>> SeedRolesAsync(ApplicationDbContext db)
    {
        var definitions = new (string Name, string Description)[]
        {
            ("Admin",           "Full access to masters, reports and overrides."),
            ("Gate 6 Operator", "Entry security — taps arriving buses and assigns platforms."),
            ("Gate 1 Operator", "Exit security — marks buses as departed."),
            ("Teacher",         "Views class rosters and the live boarding board."),
            ("Parent",          "Views only their own children's bus and platform."),
        };

        var map = new Dictionary<string, int>();
        foreach (var (name, description) in definitions)
        {
            var role = await GetOrAddAsync(db, db.RoleMasters,
                r => r.RoleName == name,
                () => new RoleMaster { RoleName = name, Description = description });
            map[name] = role.Id;
        }

        return map;
    }

    // -------------------------------------------------------------------- menus

    private static async Task SeedMenusAsync(ApplicationDbContext db, Dictionary<string, int> roles)
    {
        var dashboard = await GetOrAddAsync(db, db.MenuMasters,
            m => m.Name == "Dashboard",
            () => new MenuMaster { Name = "Dashboard", Route = "/dashboard", Icon = "dashboard", OrderNo = 1 });

        var liveBoard = await GetOrAddAsync(db, db.MenuMasters,
            m => m.Name == "Live Board",
            () => new MenuMaster { Name = "Live Board", Route = "/live-board", Icon = "monitor", OrderNo = 2 });

        var masters = await GetOrAddAsync(db, db.MenuMasters,
            m => m.Name == "Masters",
            () => new MenuMaster { Name = "Masters", Icon = "database", OrderNo = 3 });

        var children = new (string Name, string Route, int Order)[]
        {
            ("Routes",         "/masters/routes",    1),
            ("Buses",          "/masters/buses",     2),
            ("Platforms",      "/masters/platforms", 3),
            ("Gates",          "/masters/gates",     4),
            ("Displays",       "/masters/displays",  5),
            ("Students",       "/masters/students",  6),
            ("Parents",        "/masters/parents",   7),
            ("Academic Years", "/masters/academic-years", 8),
            ("Users",          "/masters/users",     9),
            ("Roles",          "/masters/roles",    10),
        };

        foreach (var (name, route, order) in children)
        {
            await GetOrAddAsync(db, db.MenuMasters,
                m => m.Name == name && m.ParentId == masters.Id,
                () => new MenuMaster { Name = name, Route = route, ParentId = masters.Id, OrderNo = order });
        }

        var reports = await GetOrAddAsync(db, db.MenuMasters,
            m => m.Name == "Reports",
            () => new MenuMaster { Name = "Reports", Route = "/reports", Icon = "chart", OrderNo = 4 });

        var auditTrail = await GetOrAddAsync(db, db.MenuMasters,
            m => m.Name == "Audit Trail",
            () => new MenuMaster { Name = "Audit Trail", Route = "/audit", Icon = "history", OrderNo = 5 });

        // Admin sees everything; the gate roles only need the live board.
        var allMenus = await db.MenuMasters.Where(m => !m.IsDeleted).Select(m => m.Id).ToListAsync();
        foreach (var menuId in allMenus)
            await AssignMenuAsync(db, menuId, roles["Admin"]);

        foreach (var roleName in new[] { "Gate 6 Operator", "Gate 1 Operator" })
        {
            await AssignMenuAsync(db, dashboard.Id, roles[roleName]);
            await AssignMenuAsync(db, liveBoard.Id, roles[roleName]);
        }

        await AssignMenuAsync(db, liveBoard.Id, roles["Teacher"]);
        await AssignMenuAsync(db, reports.Id, roles["Teacher"]);
        await AssignMenuAsync(db, liveBoard.Id, roles["Parent"]);
        _ = auditTrail;
    }

    private static async Task AssignMenuAsync(ApplicationDbContext db, int menuId, int roleId)
    {
        await GetOrAddAsync(db, db.MenuAssignments,
            a => a.MenuId == menuId && a.RoleId == roleId,
            () => new MenuAssignment { MenuId = menuId, RoleId = roleId });
    }

    // -------------------------------------------------------------------- users

    private static async Task<Dictionary<string, int>> SeedUsersAsync(
        ApplicationDbContext db, IConfiguration configuration,
        Dictionary<string, int> roles, ILogger logger)
    {
        var seedPassword = configuration["Seed:AdminPassword"];
        var map = new Dictionary<string, int>();

        if (string.IsNullOrWhiteSpace(seedPassword))
        {
            logger.LogWarning(
                "Seed:AdminPassword is not set — skipping user seeding. " +
                "Students will be created without class teachers.");
            return map;
        }

        // Hash once: BCrypt at work factor 12 is deliberately slow.
        var hash = PasswordHasher.Hash(seedPassword);

        var definitions = new (string Code, string Name, string Email, string Contact, string Role)[]
        {
            ("EMP001", "System Administrator", "admin@dpsnerul.edu",          "9820000001", "Admin"),
            ("EMP002", "Ramesh Gaikwad",       "gate6.security@dpsnerul.edu", "9820000002", "Gate 6 Operator"),
            ("EMP003", "Suresh Pawar",         "gate1.security@dpsnerul.edu", "9820000003", "Gate 1 Operator"),
            ("EMP004", "Meena Iyer",           "meena.iyer@dpsnerul.edu",     "9820000004", "Teacher"),
            ("EMP005", "Anil Deshmukh",        "anil.deshmukh@dpsnerul.edu",  "9820000005", "Teacher"),
            ("EMP006", "Sunita Rao",           "sunita.rao@dpsnerul.edu",     "9820000006", "Teacher"),
            ("EMP007", "Vikram Joshi",         "vikram.joshi@dpsnerul.edu",   "9820000007", "Teacher"),
            ("EMP008", "Priya Menon",          "priya.menon@dpsnerul.edu",    "9820000008", "Teacher"),
            // A parent sign-in. The contact is deliberately the same number as
            // the ParentMaster record below, so the person is reachable on one
            // number whichever table you look them up in. The link the app uses
            // is ParentMaster.UserId, set in SeedStudentsAndParentsAsync.
            ("PAR001", "Rajesh Sharma",        "rajesh.sharma@gmail.com",     "9821004501", "Parent"),
        };

        foreach (var (code, name, email, contact, role) in definitions)
        {
            var user = await GetOrAddAsync(db, db.UserMasters,
                u => u.EmployeeCode == code,
                () => new UserMaster
                {
                    EmployeeCode = code,
                    Name = name,
                    EmailId = email,
                    Contact = contact,
                    RoleId = roles[role],
                    PasswordHash = hash,
                    PasswordUpdatedAt = DateTime.UtcNow,
                    // Seeded credentials are shared and known — force a change on first use.
                    MustChangePassword = true,
                    Address = "Delhi Public School, Nerul, Navi Mumbai"
                });
            map[code] = user.Id;
        }

        return map;
    }

    // ------------------------------------------------------------------- routes

    /// <summary>
    /// One route per running bus, as the school actually operates. The first
    /// five keep their original codes so existing allocations, students and
    /// boarding history still resolve.
    /// </summary>
    private static async Task<Dictionary<string, int>> SeedRoutesAsync(ApplicationDbContext db)
    {
        var definitions = new (string Code, string Name, string LedName)[]
        {
            ("VS17", "Vashi Sec-17",     "VASHI SEC-17"),
            ("SW",   "Seawoods",         "SEAWOODS"),
            ("BLP",  "Belapur",          "BELAPUR"),
            ("NRE",  "Nerul East",       "NERUL EAST"),
            ("KHG",  "Kharghar",         "KHARGHAR"),
            ("NRW",  "Nerul West",       "NERUL WEST"),
            ("SNP",  "Sanpada",          "SANPADA"),
            ("KPK",  "Koparkhairane",    "KOPARKHAIRANE"),
            ("AIR",  "Airoli",           "AIROLI"),
            ("GHN",  "Ghansoli",         "GHANSOLI"),
            ("PNV",  "Panvel",           "PANVEL"),
            ("ULW",  "Ulwe",             "ULWE"),
            ("TLJ",  "Taloja",           "TALOJA"),
            ("TRB",  "Turbhe",           "TURBHE"),
            ("SRS",  "Sarsole",          "SARSOLE"),
            ("SHV",  "Shiravane",        "SHIRAVANE"),
            ("MLT",  "Millennium Towers","MILLENNIUM"),
            ("SW54", "Seawoods Sec-54",  "SEAWOODS 54"),
            ("KKT",  "Kukshet",          "KUKSHET"),
            ("VS27", "Vashi Sec-27",     "VASHI SEC-27"),
            ("KLB",  "Kalamboli",        "KALAMBOLI"),
            ("KMT",  "Kamothe",          "KAMOTHE"),
            ("DRN",  "Dronagiri",        "DRONAGIRI"),
            ("NR6",  "Nerul Sec-6",      "NERUL SEC-6"),
            ("NR48", "Nerul Sec-48",     "NERUL SEC-48"),
            ("BL11", "Belapur Sec-11",   "BELAPUR 11"),
            ("KHOW", "Kharghar Owe",     "KHARGHAR OWE"),
            ("KH35", "Kharghar Sec-35",  "KHARGHAR 35"),
            ("VS9",  "Vashi Sec-9",      "VASHI SEC-9"),
            ("KP20", "Koparkhairane 20", "KOPARKHAIRANE 20"),
            ("AI8A", "Airoli Sec-8A",    "AIROLI 8A"),
            ("GHTL", "Ghansoli Talavali","GHANSOLI TAL"),
            ("SNP5", "Sanpada Sec-5",    "SANPADA 5"),
            ("NR21", "Nerul Sec-21",     "NERUL SEC-21"),
            ("SW44", "Seawoods Sec-44",  "SEAWOODS 44"),
            ("PNVE", "New Panvel East",  "NEW PANVEL E"),
            ("KM20", "Kamothe Sec-20",   "KAMOTHE 20"),
            ("UL23", "Ulwe Sec-23",      "ULWE 23"),
            ("TLPD", "Taloja Padghe",    "TALOJA PADGHE"),
            ("TR26", "Turbhe Sec-26",    "TURBHE 26"),
            ("JNG",  "Juinagar",         "JUINAGAR"),
            ("VS28", "Vashi Sec-28",     "VASHI SEC-28"),
            ("PRSK", "Parsik Hill",      "PARSIK HILL"),
            ("NR3",  "Nerul Sec-3",      "NERUL SEC-3"),
            ("KHHR", "Kharghar Hiranandani", "KHARGHAR HIR"),
        };

        var map = new Dictionary<string, int>();
        foreach (var (code, name, ledName) in definitions)
        {
            var route = await GetOrAddAsync(db, db.RoutesMasters,
                r => r.RouteCode == code,
                () => new RoutesMaster { RouteCode = code, RouteName = name, LedDisplayName = ledName });
            map[code] = route.Id;
        }

        return map;
    }

    // -------------------------------------------------------------------- buses

    /// <summary>
    /// The real fleet: 45 running buses against 21 marked platforms, which is
    /// what makes Waiting and automatic promotion (§2.4) reachable at all. A
    /// smaller fleet can never fill the yard, so that whole path would go
    /// untested — and it is the behaviour students actually experience.
    /// </summary>
    private static async Task<Dictionary<string, int>> SeedBusesAsync(
        ApplicationDbContext db, Dictionary<string, int> routes)
    {
        // One bus per route, in route order. The first five keep the numbers
        // the school's own dispersal sheet uses.
        var running = new (string Number, string RouteCode)[]
        {
            ("18", "VS17"), ("22", "SW"),   ("31", "BLP"),  ("12", "NRE"),  ("45", "KHG"),
            ("01", "NRW"),  ("02", "SNP"),  ("03", "KPK"),  ("04", "AIR"),  ("05", "GHN"),
            ("06", "PNV"),  ("07", "ULW"),  ("08", "TLJ"),  ("09", "TRB"),  ("10", "SRS"),
            ("11", "SHV"),  ("13", "MLT"),  ("14", "SW54"), ("15", "KKT"),  ("16", "VS27"),
            ("17", "KLB"),  ("19", "KMT"),  ("20", "DRN"),  ("21", "NR6"),  ("23", "NR48"),
            ("24", "BL11"), ("25", "KHOW"), ("26", "KH35"), ("27", "VS9"),  ("28", "KP20"),
            ("29", "AI8A"), ("30", "GHTL"), ("32", "SNP5"), ("33", "NR21"), ("34", "SW44"),
            ("35", "PNVE"), ("36", "KM20"), ("37", "UL23"), ("38", "TLPD"), ("39", "TR26"),
            ("40", "JNG"),  ("41", "VS28"), ("42", "PRSK"), ("43", "NR3"),  ("44", "KHHR"),
        };

        var drivers = new[]
        {
            "R. Shinde", "V. More", "S. Jadhav", "P. Gaikwad", "A. Chavan", "M. Bhosale",
            "D. Kadam", "N. Salunkhe", "K. Waghmare", "T. Patil", "G. Sawant", "B. Thorat",
        };

        var definitions = new List<(string Number, string? RouteCode, string Type)>();
        foreach (var (number, routeCode) in running)
            definitions.Add((number, routeCode, BusKind.Active));
        // The contractor's spares — the 11th-hour substitutions in the brief.
        definitions.Add(("R1", null, BusKind.Reserve));
        definitions.Add(("R2", null, BusKind.Reserve));

        var map = new Dictionary<string, int>();
        for (int i = 0; i < definitions.Count; i++)
        {
            var (number, routeCode, type) = definitions[i];
            var bus = await GetOrAddAsync(db, db.BusesMasters,
                b => b.BusNumber == number,
                () => new BusesMaster
                {
                    BusNumber = number,
                    RouteId = routeCode is null ? null : routes[routeCode],
                    BusType = type,
                    Capacity = 40,
                    DriverName = drivers[i % drivers.Length],
                    DriverPhone = $"98200{11000 + i}"
                });
            map[number] = bus.Id;
        }

        return map;
    }

    // ---------------------------------------------------------------- platforms

    private static async Task SeedPlatformsAsync(ApplicationDbContext db)
    {
        var exit1 = await db.GateMasters.FirstOrDefaultAsync(g => g.GateCode == "EXIT1");
        var exit2 = await db.GateMasters.FirstOrDefaultAsync(g => g.GateCode == "EXIT2");

        // 23 platforms at one bus-length spacing, per the brief. The first half of the
        // U is nearest Exit 1, the second half nearest Exit 2.
        for (int number = 1; number <= 23; number++)
        {
            int platformNumber = number;
            await GetOrAddAsync(db, db.PlatformsMasters,
                p => p.PlatformNumber == platformNumber,
                () => new PlatformsMaster
                {
                    PlatformNumber = platformNumber,
                    PlatformName = $"Station {platformNumber:00}",
                    SortOrder = platformNumber,
                    NearestGateId = platformNumber <= 12 ? exit1?.Id : exit2?.Id
                });
        }
    }

    // -------------------------------------------------------- students & parents

    private static async Task<int> SeedStudentsAndParentsAsync(
        ApplicationDbContext db, GeographyIds geography,
        Dictionary<string, int> users, Dictionary<string, int> routes, Dictionary<string, int> buses)
    {
        var year = await db.AcademicYearMasters.FirstOrDefaultAsync(a => a.IsCurrent && !a.IsDeleted);
        if (year is null)
            return 0;

        var exit1 = await db.GateMasters.FirstOrDefaultAsync(g => g.GateCode == "EXIT1");
        var exit2 = await db.GateMasters.FirstOrDefaultAsync(g => g.GateCode == "EXIT2");

        int? TeacherId(string code) => users.TryGetValue(code, out var id) ? id : null;

        var definitions = new[]
        {
            new StudentSeed("DPS/2026/0101", "Aarav", "Rajesh", "Sharma", "5", "A",
                "EMP004", "18", "VS17", exit1?.Id, "Vashi Sector 17 Bus Stop", true),
            // Sibling of Aarav — same father, different class, bus and exit.
            new StudentSeed("DPS/2026/0106", "Anaya", "Rajesh", "Sharma", "2", "B",
                "EMP006", "18", "VS17", exit1?.Id, "Vashi Sector 17 Bus Stop", true),
            new StudentSeed("DPS/2026/0102", "Diya", "Sanjay", "Nair", "8", "B",
                "EMP005", "22", "SW", exit2?.Id, "Seawoods Darave Station", true),
            new StudentSeed("DPS/2026/0103", "Kabir", null, "Patil", "2", "C",
                "EMP006", "31", "BLP", exit1?.Id, "CBD Belapur Sector 11", true),
            new StudentSeed("DPS/2026/0104", "Ishita", "Amit", "Kulkarni", "11", "A",
                "EMP007", "12", "NRE", exit2?.Id, "Nerul East Sector 20", true),
            // Private transport — no bus, no route, and must survive an inner join.
            new StudentSeed("DPS/2026/0105", "Rehan", "Farhan", "Shaikh", "Jr KG", "B",
                "EMP008", null, null, exit1?.Id, null, false),
        };

        foreach (var s in definitions)
        {
            await GetOrAddAsync(db, db.StudentMasters,
                x => x.AdmissionNumber == s.AdmissionNumber,
                () => new StudentMaster
                {
                    AdmissionNumber = s.AdmissionNumber,
                    FirstName = s.FirstName,
                    MiddleName = s.MiddleName,
                    LastName = s.LastName,
                    Grade = s.Grade,
                    Division = s.Division,
                    AcademicYearId = year.Id,
                    ClassTeacherId = TeacherId(s.TeacherCode),
                    BusId = s.BusNumber is null ? null : buses[s.BusNumber],
                    RouteId = s.RouteCode is null ? null : routes[s.RouteCode],
                    ExitGateId = s.ExitGateId,
                    PickupStop = s.Stop,
                    DropStop = s.Stop,
                    UsesTransport = s.UsesTransport,
                    PhotoUrl = $"/uploads/students/{s.AdmissionNumber.Replace('/', '_').ToLowerInvariant()}.jpg"
                });
        }

        // Only Rajesh carries a sign-in account: he has two children on the same
        // bus, which is the case the parent screen has to get right. The rest
        // stay contact-only records, which is the normal state for a parent.
        var parents = new[]
        {
            new ParentSeed("Rajesh",  "Sharma",   "9821004501", "rajesh.sharma@gmail.com",   "Father",
                new[] { ("DPS/2026/0101", true), ("DPS/2026/0106", true) }, "PAR001"),
            new ParentSeed("Kavita",  "Sharma",   "9821004502", "kavita.sharma@gmail.com",   "Mother",
                new[] { ("DPS/2026/0101", false), ("DPS/2026/0106", false) }, null),
            new ParentSeed("Sanjay",  "Nair",     "9702214788", "sanjay.nair@yahoo.in",      "Father",
                new[] { ("DPS/2026/0102", true) }, null),
            new ParentSeed("Prakash", "Patil",    "9930011245", "prakash.patil@gmail.com",   "Father",
                new[] { ("DPS/2026/0103", true) }, null),
            new ParentSeed("Amit",    "Kulkarni", "9820556310", "amit.kulkarni@outlook.com", "Father",
                new[] { ("DPS/2026/0104", true) }, null),
            new ParentSeed("Farhan",  "Shaikh",   "9769887412", "farhan.shaikh@gmail.com",   "Father",
                new[] { ("DPS/2026/0105", true) }, null),
        };

        int priority = 1;
        foreach (var p in parents)
        {
            int? parentUserId = p.UserCode is not null && users.TryGetValue(p.UserCode, out var uid)
                ? uid
                : null;

            var parent = await GetOrAddAsync(db, db.ParentMasters,
                x => x.MobileNumber == p.Mobile,
                () => new ParentMaster
                {
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    MobileNumber = p.Mobile,
                    Email = p.Email,
                    AddressLine1 = "Navi Mumbai",
                    CityId = geography.CityId,
                    StateId = geography.StateId,
                    PinCodeId = geography.PinCodeId,
                    IsMobileVerified = true,
                    UserId = parentUserId
                });

            // Back-fill on a re-run: the parent row may predate the sign-in account.
            if (parentUserId is not null && parent.UserId != parentUserId)
            {
                parent.UserId = parentUserId;
                await db.SaveChangesAsync();
            }

            foreach (var (admissionNumber, isPrimary) in p.Children)
            {
                var student = await db.StudentMasters
                    .FirstOrDefaultAsync(x => x.AdmissionNumber == admissionNumber && !x.IsDeleted);
                if (student is null) continue;

                int studentId = student.Id, parentId = parent.Id;
                await GetOrAddAsync(db, db.StudentParentMappings,
                    m => m.StudentId == studentId && m.ParentId == parentId,
                    () => new StudentParentMapping
                    {
                        StudentId = studentId,
                        ParentId = parentId,
                        Relation = p.Relation,
                        IsPrimaryContact = isPrimary,
                        IsEmergencyContact = !isPrimary,
                        ContactPriority = isPrimary ? 1 : 2
                    });
            }
            priority++;
        }
        _ = priority;

        return await db.StudentMasters.CountAsync(s => !s.IsDeleted);
    }

    private sealed record StudentSeed(
        string AdmissionNumber, string FirstName, string? MiddleName, string LastName,
        string Grade, string Division, string TeacherCode, string? BusNumber,
        string? RouteCode, int? ExitGateId, string? Stop, bool UsesTransport);

    private sealed record ParentSeed(
        string FirstName, string LastName, string Mobile, string Email, string Relation,
        (string AdmissionNumber, bool IsPrimary)[] Children,
        /// <summary>Employee code of this parent's sign-in account, when they have one.</summary>
        string? UserCode);

    // --------------------------------------------------- bus route allocations

    /// <summary>
    /// A standing allocation for every running bus, taken from the bus's own
    /// default route so the two can never disagree. The reserves get none — a
    /// reserve earns a route only through a one-day override when it
    /// substitutes, which is exactly what the replace flow writes.
    /// </summary>
    private static async Task SeedAllocationsAsync(
        ApplicationDbContext db, Dictionary<string, int> routes, Dictionary<string, int> buses)
    {
        var from = new DateOnly(2026, 6, 1);
        _ = routes;

        // Read the pairing back off the buses rather than repeating the list:
        // a second copy is a second thing to get out of step.
        var pairs = await db.BusesMasters
            .Where(b => !b.IsDeleted && b.RouteId != null && b.BusType == BusKind.Active)
            .Select(b => new { b.BusNumber, RouteId = b.RouteId!.Value })
            .ToListAsync();

        foreach (var pair in pairs)
        {
            int routeId = pair.RouteId, busId = buses[pair.BusNumber];
            await GetOrAddAsync(db, db.BusRouteAllocations,
                a => a.RouteId == routeId && a.BusId == busId
                     && a.AllocationType == AllocationKind.Standing,
                () => new BusRouteAllocation
                {
                    RouteId = routeId,
                    BusId = busId,
                    AllocationType = AllocationKind.Standing,
                    EffectiveFrom = from,
                    EffectiveTo = null,
                    Reason = "Standing allocation for the 2026-2027 school year."
                });
        }
    }

    // ------------------------------------------------- one worked dispersal day

    private static async Task SeedDispersalDemoAsync(
        ApplicationDbContext db, Dictionary<string, int> buses, Dictionary<string, int> routes,
        Dictionary<string, int> users, Dictionary<string, int> roles)
    {
        var sessionDate = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        const string shift = "Afternoon Pickup";

        if (await db.Sessions.AnyAsync(s => s.SessionDate == sessionDate && s.ShiftName == shift && !s.IsDeleted))
            return;

        // The 12:45–2:30 pm window described in the brief.
        var start = DateTime.UtcNow.Date.AddHours(12).AddMinutes(45);

        var session = new Sessions
        {
            SessionDate = sessionDate,
            ShiftName = shift,
            StartedAt = start,
            Status = "Open"
        };
        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        var platforms = await db.PlatformsMasters
            .Where(p => !p.IsDeleted).OrderBy(p => p.SortOrder).Take(5).ToListAsync();

        // Mirrors the sample board in the proposal, including one already departed.
        var routeOf = new Dictionary<string, string>
        {
            ["18"] = "VS17", ["22"] = "SW", ["31"] = "BLP", ["12"] = "NRE", ["45"] = "KHG",
        };

        var rows = new (string Bus, string Status, int Queue, int Offset)[]
        {
            ("18", BoardingStatus.Boarding, 1, 0),
            ("22", BoardingStatus.Boarding, 2, 2),
            ("31", BoardingStatus.Arrived,  3, 4),
            ("12", BoardingStatus.Waiting,  4, 6),
            ("45", BoardingStatus.Departed, 5, 8),
        };

        var events = new List<BoardingEvents>();
        foreach (var (bus, status, queue, offset) in rows)
        {
            var enteredAt = start.AddMinutes(offset);
            bool holdsPlatform = status != BoardingStatus.Waiting;
            events.Add(new BoardingEvents
            {
                SessionId = session.Id,
                BusId = buses[bus],
                RouteId = routes[routeOf[bus]],
                PlatformId = holdsPlatform ? platforms[queue - 1].Id : null,
                Status = status,
                QueueOrder = queue,
                EnteredAt = enteredAt,
                AssignedAt = holdsPlatform ? enteredAt.AddSeconds(20) : null,
                DepartedAt = status == BoardingStatus.Departed ? enteredAt.AddMinutes(12) : null
            });
        }

        db.BoardingEvents.AddRange(events);
        await db.SaveChangesAsync();

        var gateOperator = users.TryGetValue("EMP002", out var opId) ? opId : (int?)null;

        db.AuditLogs.AddRange(
            new AuditLog
            {
                SessionId = session.Id,
                BoardingEventId = events[0].Id,
                RoleId = roles["Gate 6 Operator"],
                ActorUserId = gateOperator,
                ActorName = "Ramesh Gaikwad",
                ActionType = "Assign",
                PreviousValue = null,
                NewValue = $"Platform {platforms[0].PlatformNumber}",
                Details = "Bus 18 assigned on entry through Gate No. 6."
            },
            new AuditLog
            {
                SessionId = session.Id,
                BoardingEventId = events[4].Id,
                RoleId = roles["Gate 1 Operator"],
                ActorUserId = users.TryGetValue("EMP003", out var exitId) ? exitId : null,
                ActorName = "Suresh Pawar",
                ActionType = "Depart",
                PreviousValue = "Boarding",
                NewValue = "Departed",
                Details = "Bus 45 marked departed at Gate No. 1."
            });

        await db.SaveChangesAsync();
    }

    // ------------------------------------------------------------------- helper

    /// <summary>
    /// Returns the row matching <paramref name="match"/>, inserting the factory result
    /// if none exists. Saves immediately so the caller can rely on the generated id.
    /// </summary>
    private static async Task<TEntity> GetOrAddAsync<TEntity>(
        ApplicationDbContext db,
        DbSet<TEntity> set,
        System.Linq.Expressions.Expression<Func<TEntity, bool>> match,
        Func<TEntity> factory) where TEntity : BaseEntity
    {
        var existing = await set.FirstOrDefaultAsync(match);
        if (existing is not null)
            return existing;

        var entity = factory();
        set.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }
}
