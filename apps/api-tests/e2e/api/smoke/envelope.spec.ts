import { API } from '../../config/env';
import { expect, test } from '../../fixtures/api.fixture';
import { items, type PagedResult } from '../../helpers/envelope';
import { call, expectFail, expectOk, raw } from '../../helpers/http';

/**
 * Read-only smoke. Proves the API is up, the cached token works, and the three
 * contract rules the rest of the suite depends on actually hold.
 */
test.describe('smoke: envelope contract', () => {
  test('an authenticated read returns the envelope over HTTP 200', async ({ api }) => {
    const c = await call<PagedResult>(api, 'get', `${API}/GateMaster?pageNumber=1&pageSize=5`);

    expect(c.http, c.where).toBe(200);
    expect(c.env.Success, c.where).toBe(true);
    expect(c.env.StatusCode, c.where).toBe(200);
    expect(c.env.ErrorMessage, c.where).toBeNull();
    expect(items(c.env.Result).length, 'the seeder creates 4 gates').toBeGreaterThan(0);
  });

  test('a failure is HTTP 200 with the real code inside the body', async ({ api }) => {
    // This is the rule the whole suite exists to defend. `res.ok()` is true here.
    const c = await call(api, 'get', `${API}/GateMaster/999999999`);

    expect(c.http, 'the wrapper always sends HTTP 200').toBe(200);
    expect(c.env.Success, c.where).toBe(false);
    expect(c.env.StatusCode, c.where).toBe(404);
    expect(c.env.Result, c.where).toBeNull();
    expect(c.env.ErrorMessage, c.where).toBeTruthy();
  });

  test('an un-routed URL is wrapped too, by the middleware rather than the filter', async ({ api }) => {
    // ApiResponseMiddleware catches requests that never match an endpoint, so even a
    // typo'd path keeps the contract instead of returning Kestrel's bare 404.
    const env = await expectFail(api, 'get', `${API}/NoSuchController`, 404);
    expect(env.ErrorMessage).toContain('NoSuchController');
  });

  test('an unauthenticated request is a REAL HTTP 401 with no envelope', async ({ anon }) => {
    // The documented exception. AuthorizationMiddleware short-circuits before MVC, so
    // ApiResponseWrapperFilter never runs and there is no body to parse. A test that
    // assumed the envelope here would fail with an opaque JSON error.
    const res = await anon.get(`${API}/GateMaster`);

    expect(res.status(), 'auth failures bypass the wrapper entirely').toBe(401);
    expect(await raw(res), 'the 401 carries no envelope').toBeUndefined();
  });

  test('the seeded reference data the other suites lean on is present', async ({ api }) => {
    const gates = await expectOk<PagedResult>(api, 'get', `${API}/GateMaster?pageNumber=1&pageSize=100`);
    const routes = await expectOk<PagedResult>(api, 'get', `${API}/RoutesMaster?pageNumber=1&pageSize=100`);
    const years = await expectOk<PagedResult>(api, 'get', `${API}/AcademicYearMaster?pageNumber=1&pageSize=100`);

    expect(items(gates).length, 'gates: Gate 6, Gate 1, EXIT1, EXIT2').toBeGreaterThanOrEqual(4);
    expect(items(routes).length, 'routes').toBeGreaterThanOrEqual(5);
    expect(items(years).length, 'academic years').toBeGreaterThanOrEqual(1);
  });
});
