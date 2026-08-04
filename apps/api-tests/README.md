# Transit Display Platform — API test suite

Playwright, API only. No browser: every spec uses the `request` fixture against the
.NET backend in `apps/backend`. It is the executable form of
`TransitDisplayPlatform.postman_collection.json` — same endpoints, but the assertions
actually run and actually fail.

## Run it

```bash
cd apps/api-tests && npm install
```

```bash
cp .env.test.example .env.test
```

Start the API (the `https` profile — see "HTTPS redirect" below), then:

```bash
npm test
```

| Command | What it runs |
| --- | --- |
| `npm run test:smoke` | Read-only contract checks. Safe anywhere. |
| `npm test` | Everything. Write suites skip unless `ALLOW_WRITES=1`. |
| `npm run report` | Opens the last HTML report. |

## Three things about this API that break naive tests

**1. Errors arrive as HTTP 200.** `ApiResponseWrapperFilter` rewrites every controller
result into `{ Success, Result, StatusCode, ErrorMessage }` and sets the HTTP status to
200 unconditionally. A 404, a validation failure and a 500 all come back as `200 OK`.

```ts
expect(res.ok()).toBeTruthy();   // passes on every possible failure. Asserts nothing.
```

Use `expectOk` / `expectFail` from `e2e/helpers/http.ts`; they read `body.Success` and
`body.StatusCode`, which is where the real outcome lives.

**2. Except when it doesn't.** Unauthenticated requests to an `[Authorize]` controller
are a *real* HTTP 401 with an empty body — `AuthorizationMiddleware` short-circuits
before MVC, so the wrapper never runs and there is nothing to parse. That asymmetry has
its own file: `e2e/api/auth/unauthenticated.spec.ts`.

**3. HTTPS redirect.** `Program.cs` calls `UseHttpsRedirection()` unconditionally,
including in Development, and the dev certificate is self-signed. Every request context
sets `ignoreHTTPSErrors: true`, and `API_BASE_URL` defaults to the `https` profile
(`https://localhost:7074`). An `http://` base URL gets a 307 to the same place.

## Writes are off by default

`apps/backend/appsettings.json` commits

```
Server=4.240.53.172;Database=transit_display_platform_dev
```

— a **shared** dev SQL Server. Running `dotnet run` on your laptop does not make the
database local. Every `DELETE` in this API is soft (`IsDeleted = 1`), so rows a test run
creates are never reclaimed; they just accumulate for everyone. The project's own
Postman notes say the same thing.

So the create/patch/delete suites call `skipIfWritesBlocked()` and stay skipped until
you point the API at a database you own and set `ALLOW_WRITES=1` in `.env.test`.

Read-only suites — smoke, geography, the seeded-data assertions, all the `GET` and
negative-path specs — run regardless.

## Login happens once

`global-setup.ts` logs in a single time and caches the token in `e2e/.auth/token.json`
(gitignored). This is a correctness requirement, not a speed optimisation:
`AuthService` locks an account for 15 minutes after 5 failed attempts, and there is one
seeded login. A suite that logged in per-spec would be one bad password away from
locking `EMP001` for everybody on that database. The token lasts 60 minutes
(`JwtSettings.AccessTokenExpiryMinutes`), so there is no in-run refresh.

For the same reason `playwright.config.ts` pins `workers: 1`. Parallelism unlocks when
each worker index has its own seeded `UserMaster` row.

The seeded password is **not** in source — it comes from the API's `Seed:AdminPassword`
(user-secrets or `SEED__ADMINPASSWORD`). Put it in `.env.test` as `LOGIN_PASSWORD`.

## Unique keys, not cleanup

The schema hardening added 17 unique indexes. A fixed literal like the Postman
collection's `"EXIT3"` creates fine the first time and fails forever after, with an
error that reads like a broken endpoint. `e2e/helpers/factory.ts` generates a run-unique
key for every one of them, inside the real column limits — `GateCode`, `DisplayCode` and
`BusNumber` are `MaxLength(20)`, and `AcademicYearMaster.YearName` is `MaxLength(9)`,
which has room for `2040-2041` and nothing else.

Isolation comes from unique data, never from teardown. The one exception is
`academic-year-master.spec.ts`, which promotes a throwaway year to test the demotion
rule and then puts the real year back — leaving a test year current would change which
year new students are assigned to.

## Layout

```
e2e/
  config/env.ts          .env.test loader, base URL, the write guard
  global-setup.ts        one login, token cached to .auth/
  fixtures/api.fixture.ts  api (bearer) / anon contexts, skipIfWritesBlocked()
  helpers/
    envelope.ts          the { Success, Result, StatusCode, ErrorMessage } contract
    http.ts              call / expectOk / expectFail
    crud.ts              the parameterised CRUD runner
    factory.ts           run-unique keys within the real column limits
  api/
    smoke/               read-only; proves the contract itself holds
    auth/                login, lockout-safe negatives, 401 behaviour
    masters/             gate, routes, buses, platforms, role, user, academic year, geography
    displays/            display CRUD, validation, the anonymous heartbeat
    students/            student, parent, and the family relationship
    menus/               menu tree, bulk reorder, role assignment
```

A new master costs ~6 lines against `runCrudSuite`, not a new spec file. It asserts the
whole cycle: create (201 *inside* the envelope), read back, appear in a page, partial
patch, 404 for a missing id, soft delete, 404 after delete, and 404 on a second delete.

## Negative tests never touch a real account

`AuthService` only increments `FailedLoginAttempts` when the username resolves to a
user. Every bad-credential test therefore uses a username that cannot exist. Testing a
wrong password against `EMP001` would, on the fifth run, lock the only seeded account.
