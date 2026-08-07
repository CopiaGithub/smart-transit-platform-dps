import { API } from '../../config/env';
import { expect, test } from '../../fixtures/api.fixture';
import { raw } from '../../helpers/http';

/**
 * Every controller except Auth and the display heartbeat carries [Authorize].
 *
 * These assert on the REAL HTTP status, not the envelope: AuthorizationMiddleware runs
 * before MVC, so ApiResponseWrapperFilter never sees the request and there is no
 * envelope to read. That asymmetry is the single most confusing thing about this API's
 * error handling, so it gets its own file.
 */
const PROTECTED = [
  'StudentMaster',
  'ParentMaster',
  'StudentParentMapping',
  'GateMaster',
  'DisplayMaster',
  'AcademicYearMaster',
  'RoutesMaster',
  'BusesMaster',
  'PlatformsMaster',
  'UserMaster',
  'RoleMaster',
  'MenuMaster',
  'CountryMaster',
  'RegionMaster',
  'StateMaster',
  'CityMaster',
  'PinCodeMaster',
];

test.describe('unauthenticated access', () => {
  for (const entity of PROTECTED) {
    test(`GET /api/${entity} without a token → 401`, async ({ anon }) => {
      const res = await anon.get(`${API}/${entity}`);
      expect(res.status(), `${entity} answered ${res.status()} to an anonymous read`).toBe(401);
    });
  }

  test('a malformed bearer token is rejected, not ignored', async ({ anon }) => {
    const res = await anon.get(`${API}/GateMaster`, {
      headers: { Authorization: 'Bearer not.a.jwt' },
    });
    expect(res.status()).toBe(401);
  });

  test('a token signed with the wrong key is rejected', async ({ anon }) => {
    // Header/payload look plausible; the signature does not match JwtSettings.SecretKey.
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(JSON.stringify({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') +
      '.wrongsignature';

    const res = await anon.get(`${API}/GateMaster`, { headers: { Authorization: `Bearer ${forged}` } });
    expect(res.status(), 'a forged signature was accepted').toBe(401);
  });

  test('the display heartbeat stays anonymous — the LED panels have no credentials', async ({ anon }) => {
    // [AllowAnonymous] on purpose: the panels are unattended devices on the wired LAN.
    // An unknown code still reaches the controller, so this comes back as an envelope.
    const res = await anon.post(`${API}/DisplayMaster/NO-SUCH-PANEL/heartbeat`);
    expect(res.status(), 'heartbeat must not require a token').toBe(200);

    const body = await raw(res);
    expect(body, 'heartbeat answered with no body').toBeDefined();
  });
});
