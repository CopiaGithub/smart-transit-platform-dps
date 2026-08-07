import { API, env } from '../../config/env';
import { expect, test } from '../../fixtures/api.fixture';
import { field } from '../../helpers/envelope';
import { call, expectFail } from '../../helpers/http';

/**
 * Login is the one endpoint this suite must be careful with.
 *
 * AuthService increments UserMaster.FailedLoginAttempts on every bad password and
 * locks the account for 15 minutes at 5. The counter only moves when the username
 * RESOLVES to a user — `user == null` returns the same "Invalid username or password."
 * message without touching anything. So every negative test below uses a username
 * that cannot exist. Testing a wrong password against EMP001 would, on the fifth run,
 * lock the only seeded account for everyone sharing the database.
 */
const UNKNOWN_USER = 'NOSUCHUSER-PLAYWRIGHT';

test.describe('Auth /api/Auth/login', () => {
  test('valid credentials return a JWT and its expiry', async ({ anon }) => {
    const c = await call(anon, 'post', `${API}/Auth/login`, {
      username: env.username,
      password: env.password,
    });

    expect(c.http, c.where).toBe(200);
    expect(c.env.Success, c.where).toBe(true);
    expect(c.env.StatusCode, c.where).toBe(200);

    const token = field<string>(c.env.Result, 'Token');
    expect(token, 'no Token in the login Result').toBeTruthy();
    expect(token!.split('.'), 'Token should be a three-part JWT').toHaveLength(3);

    const expiresAt = field<string>(c.env.Result, 'TokenExpiresAt');
    expect(new Date(expiresAt!).getTime(), 'TokenExpiresAt should be in the future').toBeGreaterThan(Date.now());
  });

  test('the token carries the claims the clients read', async ({ auth }) => {
    // LoginResponseModel deliberately returns only Token + expiry; every user detail
    // lives in the token itself, so the mobile app has nothing else to parse.
    const claimValues = Object.values(auth.claims).map(String);
    expect(claimValues, `claims: ${JSON.stringify(auth.claims)}`).toContain(env.username);
    expect(auth.claims['exp'], 'no exp claim').toBeTruthy();
  });

  test('an unknown username is rejected as 401 inside the envelope', async ({ anon }) => {
    const e = await expectFail(anon, 'post', `${API}/Auth/login`, 401, {
      username: UNKNOWN_USER,
      password: 'whatever',
    });

    // Same message for "no such user" and "wrong password" — deliberate, so the
    // endpoint cannot be used to enumerate valid employee codes.
    expect(e.ErrorMessage).toBe('Invalid username or password.');
  });

  test('a wrong password for an unknown user gives the identical message', async ({ anon }) => {
    const e = await expectFail(anon, 'post', `${API}/Auth/login`, 401, {
      username: `${UNKNOWN_USER}-2`,
      password: 'AlsoWrong!123',
    });
    expect(e.ErrorMessage).toBe('Invalid username or password.');
  });

  test('a missing password is rejected before any lookup', async ({ anon }) => {
    // ModelState catches this — [Required] on LoginRequestModel.Password. The
    // InvalidModelStateResponseFactory flattens it to a plain string, so the envelope
    // carries 400 and a sentence rather than a validation dictionary.
    const e = await expectFail(anon, 'post', `${API}/Auth/login`, 400, { username: env.username });
    expect(e.ErrorMessage, 'validation failures should say something').toBeTruthy();
  });

  test('an empty body is rejected as 400, not 500', async ({ anon }) => {
    await expectFail(anon, 'post', `${API}/Auth/login`, 400, {});
  });

  test('login is [AllowAnonymous] — it must not require a token', async ({ anon }) => {
    // Guards against someone adding [Authorize] at the controller level and locking
    // every client out of the only way to get a token.
    const c = await call(anon, 'post', `${API}/Auth/login`, {
      username: env.username,
      password: env.password,
    });
    expect(c.http, 'login answered 401 — it is no longer anonymous').toBe(200);
  });
});
