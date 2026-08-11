# API binding

How this app talks to the Transit Display Platform API. Read this before
changing anything in `src/api/` or `src/services/apiClient.ts`.

## Environments

| APP_ENV | apiUrl |
|---|---|
| `dev` | `http://localhost:5199/api/` — the backend on this laptop |
| `qa` | `https://tdpdev.copiacs.com/tpddevapi/api/` |
| `production` | `https://tdpdev.copiacs.com/tpddevapi/api/` — placeholder |

Set in `app.config.ts`. The `localhost` in the dev URL is never used as-is:
`resolveBaseUrl()` swaps in whatever host Metro is served from, so emulator and
physical device both work with nothing to edit. Only in `--tunnel` mode does
that fall apart — the borrowed host is then an `exp.direct` domain. Run
`/localbackendconnect` to set the whole thing up.

The API listens on **5199**. `launchSettings.json` and the Postman collection
were disagreeing (5133 vs 5199); both now say 5199. Run it with:

```bash
dotnet run --no-launch-profile --urls "http://localhost:5199"
```

If it exits immediately with no output, an old instance is still holding the
port — the reason is only in `apps/backend/Logs/log-*.txt`:

```bash
Get-NetTCPConnection -State Listen -LocalPort 5199 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## The envelope — the one thing that breaks naive clients

Every response that reaches a controller is **HTTP 200**, including failures.
`ApiResponseWrapperFilter` on the server forces it and puts the real outcome in
the body:

```jsonc
{ "Success": true,  "Result": {...}, "StatusCode": 200, "ErrorMessage": null }
{ "Success": false, "Result": null,  "StatusCode": 401, "ErrorMessage": "Invalid username or password." }
```

Keys are **PascalCase** (`PropertyNamingPolicy = null`). Do not "fix" them.

So `apiClient` branches on `data.Success`, never on `response.status`, and
unwraps `Result` — the envelope must never leak past `src/api/`.

Two failures do *not* arrive wrapped, because they happen before the filter:

- **`[Authorize]` rejections** come back as a bare **403 with an empty body**.
  Treating that as a network failure would tell a guard the server is
  unreachable when they simply lack the permission.
- Anything that crashes before the pipeline runs.

`apiClient` builds an `ApiError` from the wire status in that case.

### 401 vs 403

| | means | app does |
|---|---|---|
| 401 | token gone or expired | **signs out** (`isSessionExpired`) |
| 403 | signed in, role not allowed | shows the message, **stays signed in** (`isForbidden`) |

Conflating these signs a guard out for tapping the wrong screen. Gate roles are
separated on purpose (manual §7.1), so 403 is a normal, frequent answer.

### Retry

One retry, **GET only**, and only when there was no reply at all. A write that
times out may have been processed with the answer lost — re-sending could
record the same bus through the gate twice. A guard who sees the error and taps
again is choosing that; the app must not choose it for them.

Server refusals (`Success: false`) are **never** retried.

## Auth

`POST /api/Auth/login { username, password }` → `{ Token, TokenExpiresAt }`.

**No user object comes back.** Identity is in the JWT claims, decoded by
`src/services/jwt.ts` (payload only — the server verifies signatures; a client
that trusts its own decode is trusting its own storage):

`userId · name · emailId · employeeCode · roleId · roleName · exp`

`username` accepts **email, employee code, or mobile number** — the server ORs
all three, which is why the login screen has one "username or mobile" field.

`TokenExpiresAt` is checked on restore, so an expired session never gets as far
as a failing request.

## Role → what the app shows

Server roles today: `Admin`, `Teacher`, `Parent`, `Gate 6 Operator`,
`Gate 1 Operator`. Note there is **no "Security" role** — a guard's post is part
of their role name, and there is no gate field on the user.

`src/domain/roles.ts` maps `roleName` to a viewer by finding a `GATES` label
inside it (`"Gate 6 Operator"` → the entry gate). Keyword guessing would break
the day someone adds a Gate 3.

**An unrecognised role falls through to `parent`** — the smallest menu there is.
A new role on the server must never accidentally hand someone the gate screens.

## Sessions gate everything

Nothing can be recorded until a dispersal session is open (§5.2), and only one
may be open school-wide. `GET /DispersalSession/current` answers **404** when
there is none — that is a normal state, not an error, so `session.api.ts`
translates it to `null` and everything else still throws.

Gate In, Gate Out and Boarding are wrapped in `SessionGate` (applied in
`navigation/menu.tsx` via `gated()`), so the list of screens that write to the
day is visible in one place.

## Polling

There is no push channel (manual Appendix A). `usePolling` runs while a screen
is focused, at **5 s**, and stops on blur and while `NetInfo` reports offline.

Never poll a screen the user cannot see; never poll a dead network.

## Things the server owns, and the app must not recompute

- **Platform allocation.** Lowest free active platform, `Waiting` when full,
  and automatic promotion of the longest-waiting bus when one frees. The app
  used to have a copy of this; it is gone. Two copies drift, and the wrong one
  ends up on an LED wall.
- **Uniqueness.** Bus numbers, employee codes. The server owns the index; the
  forms show its refusal rather than guessing first.
- **Board order.** Rows arrive in `QueueOrder`. Do not re-sort.
- **Search and paging.** Lists send `searchTerm`/`pageNumber`; the screen only
  ever holds one page.

## eventId is not busId

A boarding event is one bus in one session.

| call | takes |
|---|---|
| `gate-in`, `gate-out` | `busId` |
| `{eventId}/boarding`, `{eventId}/replace` | **`eventId`** |

Getting this wrong looks like it works and then acts on the wrong bus. Board and
queue rows both carry `EventId`.

## After every write, re-read

A gate-out changes a *different* bus's status server-side (promotion). Writes
re-fetch the queue rather than patching local state.

## The board is public

`GET /BusOperations/board` is served without a login — an unattended LED panel
has no user to authenticate as. `api.getPublic` skips the bearer header.
`?displayCode=` scopes it to one wall:

| code | rows |
|---|---|
| *(none)* | every bus |
| `OUT-G6` | outdoor wall |
| `IND-E1` / `IND-E2` | that exit's platforms only |

## Self-checks

No test framework. Three runnable checks cover the logic that is easy to get
silently wrong:

```bash
npx tsx src/services/jwt.ts                  # claim decoding, padding, expiry
npx tsx src/domain/roles.ts                  # role → menu, unknown roles
npx tsx src/services/apiClient.selfcheck.ts  # 401 vs 403, retry rule
```

## Known gaps

- **Parent push notifications** are not built (Appendix A). The parent screen
  polls; nothing is sent.
- **Reports** shows the current session only. History would need
  `GET /DispersalSession` plus a per-session board.
- `qa` and `production` URLs in `app.config.ts` are placeholders.
