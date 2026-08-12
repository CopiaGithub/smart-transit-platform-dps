---
name: demoreset
description: Wipe the day's dispersal data (open session, board rows, attendance) on the dev database so the client demo can be run again from an empty board. Use when the user says /demoreset, "demo reset", "clear demo data", "clear the board", or wants to show the flow from the start again.
---

# Demo reset

Goal: put the dev environment back to **"no session open, empty board"** so the
demo starts at the Open-session screen every time.

Clears (all soft-delete, `IsDeleted = 1`, so it is recoverable):

- `dispersal_sessions` — today's rows, plus any session left `Open` on an older date
- `boarding_events` — every row belonging to those sessions
- `student_attendance` — today's rows

Never touches masters — buses, routes, platforms, students, parents, users,
displays. Those are the demo fixtures; wiping them means rebuilding the demo.

## Why the API's own reset is not enough

`POST /DispersalSession/{id}/reset` only stamps live buses `Departed` and closes
the session. Two things then bite:

- `RowQuery()` in `BusOperationsService` filters on `!IsDeleted` and **nothing
  else** — `Departed` rows still render on the board.
- `OpenAsync` **reopens the existing row** when date + shift match, and the app
  calls `openSession()` with no body, so it is always today + "Afternoon Pickup".

So reset → reopen hands you the previous demo's departed buses. The backend has
the right logic in `DevLoginsSeeder.ClearOpenSessionBoardAsync` — but it only
runs at startup, behind `Seed:ClearBoardOnStart`, Development only. This skill
does the same thing without restarting anything.

## Before you run it

**The dev database is shared** (`4.240.53.172`, `transit_display_platform_dev`)
and the hosted API `tdpdev.copiacs.com` serves from it. This wipes today for
everyone on dev, not just this laptop. Preview first, tell the user the counts,
and wait for a yes.

Credentials come from `apps/backend/appsettings.json` — do not paste them into
this file or any other. Parse them:

```powershell
$b = "<repo>\apps\backend"
$c = @{}
((Get-Content "$b\appsettings.json" -Raw | ConvertFrom-Json).ConnectionStrings.DefaultConnection -split ';' | Where-Object { $_ }) | ForEach-Object { $k, $v = $_ -split '=', 2; $c[$k.Trim()] = $v }
function Sql($q) { sqlcmd -S $c['Server'] -d $c['Database'] -U $c['User Id'] -P $c['Password'] -C -h -1 -W -s "|" -Q $q }
```

## 1. Preview — what would go

```powershell
$d = Get-Date -Format 'yyyy-MM-dd'
Sql "SET NOCOUNT ON; DECLARE @d date='$d';
SELECT 'session', Id, SessionDate, ShiftName, Status FROM dispersal_sessions WHERE IsDeleted=0 AND (SessionDate=@d OR Status='Open');
SELECT 'events', COUNT(*) FROM boarding_events e JOIN dispersal_sessions s ON s.Id=e.SessionId WHERE e.IsDeleted=0 AND (s.SessionDate=@d OR s.Status='Open');
SELECT 'attendance', COUNT(*) FROM student_attendance WHERE IsDeleted=0 AND AttendanceDate=@d;"
```

Zero rows everywhere = already clean, stop here and say so.

## 2. Clear

Only after the user confirms the preview.

```powershell
$d = Get-Date -Format 'yyyy-MM-dd'
Sql "SET NOCOUNT ON; DECLARE @d date='$d';
BEGIN TRAN;
UPDATE e SET e.IsDeleted=1, e.UpdatedAt=SYSUTCDATETIME() FROM boarding_events e
  JOIN dispersal_sessions s ON s.Id=e.SessionId
  WHERE e.IsDeleted=0 AND (s.SessionDate=@d OR s.Status='Open');
UPDATE student_attendance SET IsDeleted=1, UpdatedAt=SYSUTCDATETIME()
  WHERE IsDeleted=0 AND AttendanceDate=@d;
UPDATE dispersal_sessions SET IsDeleted=1, UpdatedAt=SYSUTCDATETIME()
  WHERE IsDeleted=0 AND (SessionDate=@d OR Status='Open');
COMMIT;
SELECT 'remaining-sessions', COUNT(*) FROM dispersal_sessions WHERE IsDeleted=0 AND Status='Open';"
```

`remaining-sessions | 0` is the check that it worked.

Date is taken from **this laptop**, matching `SchoolClock`'s local-date rule —
the SQL box's own clock is not assumed to agree.

## 3. Verify against the running API

The DB says one thing; what the demo phone sees is the only thing that counts.

```powershell
(Invoke-WebRequest -Uri "https://tdpdev.copiacs.com/tdpdevapi/api/BusOperations/board" -UseBasicParsing).Content
```

Expected: `{"Success":false,...,"No dispersal session is open."}` — HTTP 200
with `Success: false`, because this API reports failures in the body. That
message is the goal state, not an error.

Then on the phone: pull to refresh → the gate screens show **Open session**.

## Undo

Nothing is hard-deleted. To bring a wiped day back, flip it in the same three
tables:

```sql
UPDATE dispersal_sessions SET IsDeleted=0 WHERE Id = <id>;
UPDATE boarding_events    SET IsDeleted=0 WHERE SessionId = <id>;
```

## Report back

Tell the user, in simple English: what was cleared (counts from step 1), that
the board endpoint now says no session is open, and that they can start the demo
at Open session.
