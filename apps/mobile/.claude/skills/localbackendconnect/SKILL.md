---
name: localbackendconnect
description: Point the Expo mobile app at the local ASP.NET backend on this laptop (port 5199) and prove a phone on the same Wi-Fi can reach it. Use when the user says /localbackendconnect, "local backend connect", "connect mobile to local API", or the hosted dev API is down.
---

# Local backend connect

Goal: phone (Expo Go, physical device, same Wi-Fi) → laptop API on **5199**.

The app already does most of this itself. `resolveBaseUrl()` in
`src/services/apiClient.ts` replaces the **host** of `extra.apiUrl` with the
host Metro is served from, but only when `appEnv === "dev"`. Port and path are
kept. So the only thing that has to be right in config is
`http://localhost:5199/api/` — no LAN IP is ever hardcoded.

Work through these in order and skip anything already true.

## 1. app.config.ts — dev env

`ENV.dev.apiUrl` must be exactly:

```
http://localhost:5199/api/
```

The hosted dev URL (`https://tdpdev.copiacs.com/tdpdevapi/api/`) is kept in the
comment right above it — swap them back when that server returns. Do not
"fix" the hostname to a LAN IP; the Metro swap handles it.

## 2. Backend running on 0.0.0.0

Check the port, start it only if dead:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5199 -ErrorAction SilentlyContinue
```

Start (background, from `apps/backend`) — the `http` profile binds
`0.0.0.0:5199`, which is what makes it reachable from the phone. Plain
`dotnet run` uses whatever profile is first and may bind localhost only:

```powershell
dotnet run --launch-profile http
```

If it exits with no output, an old instance holds the port — reason is in
`apps/backend/Logs/bootstrap-*.txt`, and:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5199 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Do not touch `Seed:SimpleDevLogins` or `Seed:ClearBoardOnStart`** in
`appsettings.Development.json`. The DB is the shared Azure dev server; one
rewrites everyone's password, the other wipes the day's boarding events.

## 3. Verify over the LAN IP, not localhost

Get the Wi-Fi address and hit the public board endpoint with it — localhost
proves nothing about what the phone sees:

```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi').IPAddress
```

```powershell
Invoke-WebRequest -Uri "http://<lan-ip>:5199/api/BusOperations/board" -UseBasicParsing | Select-Object -Expand StatusCode
```

`/BusOperations/board` needs no login. 200 with `"Success":true` = server fine.
(Remember: this API returns 200 for failures too, so read the body.)

## 4. Firewall

Already open on this machine — `Transit API 5199` (Any profile) and
`TDP Backend 5199` (Private) both Allow inbound TCP 5199. Assume it is fine and
only come back here if the phone reports a network error while step 3 passed.

Checking by name is a trap: `Get-NetFirewallRule -DisplayName ...` answers
"not found" without admin rights, so it reports a missing rule that exists.
The form that works unelevated is slow (~2 min) — background it:

```powershell
Get-NetFirewallRule -Direction Inbound -Enabled True | Where-Object { ($_ | Get-NetFirewallPortFilter).LocalPort -eq 5199 } | Select-Object DisplayName, Action, Profile
```

Genuinely missing → the user must run this in an **elevated** PowerShell (the
agent cannot, access denied):

```powershell
New-NetFirewallRule -DisplayName "TDP Backend 5199" -Direction Inbound -Protocol TCP -LocalPort 5199 -Action Allow -Profile Private
```

## 5. Restart Metro

`app.config.ts` is read once at start, so a running Expo server keeps the old
URL:

```bash
npx expo start -c
```

**LAN mode, not `--tunnel`.** With a tunnel, `hostUri` is an `exp.direct`
domain and the host swap builds `http://<something>.exp.direct:5199/api/`,
which resolves nowhere. Phone and laptop on the same Wi-Fi, no client isolation
/ guest network.

## Report back

Tell the user, in Marathi: the LAN IP the phone will use, that the backend is
listening, the board-endpoint result, and whichever of the firewall rule /
Metro restart they still have to do themselves.
