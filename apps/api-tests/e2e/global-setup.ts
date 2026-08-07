import { request } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { API, AUTH_DIR, assertNoTrailingApi, env } from './config/env';
import { asEnvelope, field } from './helpers/envelope';
import { raw } from './helpers/http';

export interface CachedAuth {
  username: string;
  token: string;
  expiresAt: string;
  /** Claims lifted out of the JWT — userId, role, employee code. */
  claims: Record<string, unknown>;
}

export const AUTH_FILE = resolve(AUTH_DIR, 'token.json');

/** Minimal JWT payload decode. No verification — the API already did that. */
function decodeClaims(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) return {};
  try {
    return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

/**
 * Log in ONCE for the whole run, cache the token, reuse it.
 *
 * This is a correctness requirement, not an optimisation. AuthService locks an account
 * for 15 minutes after 5 failed attempts and resets FailedLoginAttempts on success —
 * so a suite that logs in per-spec is one bad password away from locking the only
 * seeded account it has, for every developer sharing that database. The access token
 * lasts 60 minutes (JwtSettings.AccessTokenExpiryMinutes), comfortably longer than a
 * run, so there is deliberately no in-run refresh.
 */
async function globalSetup(): Promise<void> {
  assertNoTrailingApi(env.baseURL);
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

  console.log(`\n[global-setup] API    : ${env.baseURL}`);
  console.log(`[global-setup] user   : ${env.username}`);
  console.log(`[global-setup] writes : ${env.writesAllowed ? 'ALLOWED (ALLOW_WRITES=1)' : 'BLOCKED — read-only suites only'}`);
  console.log(`[global-setup] runId  : ${env.runId}`);

  if (!env.password) {
    throw new Error(
      '[global-setup] LOGIN_PASSWORD is empty.\n' +
        '  The seeded password is not in source — it comes from the API\'s Seed:AdminPassword\n' +
        '  (user-secrets or SEED__ADMINPASSWORD). Copy .env.test.example to .env.test and set it.',
    );
  }

  // ignoreHTTPSErrors: UseHttpsRedirection() is unconditional and the dev cert is self-signed.
  const api = await request.newContext({ baseURL: env.baseURL, ignoreHTTPSErrors: true });

  let body: unknown;
  try {
    const res = await api.post(`${API}/Auth/login`, {
      data: { username: env.username, password: env.password },
    });
    body = await raw(res);
  } catch (e) {
    await api.dispose();
    throw new Error(
      `[global-setup] Could not reach the API at ${env.baseURL}: ${(e as Error).message}\n` +
        '  Start it with:  dotnet run --project apps/backend --launch-profile https\n' +
        '  Or set API_BASE_URL in .env.test to wherever it is running.',
    );
  }
  await api.dispose();

  const envelope = asEnvelope(body);
  if (!envelope.Success) {
    throw new Error(
      `[global-setup] Login failed for "${env.username}": StatusCode ${envelope.StatusCode} — ${envelope.ErrorMessage}\n` +
        '  A locked account clears itself after 15 minutes. A wrong password counts towards\n' +
        '  that lockout, so check LOGIN_PASSWORD in .env.test before retrying.',
    );
  }

  const token = field<string>(envelope.Result, 'Token');
  if (!token) {
    throw new Error(
      `[global-setup] Login succeeded but carried no Token. Result: ${JSON.stringify(envelope.Result).slice(0, 300)}`,
    );
  }

  const auth: CachedAuth = {
    username: env.username,
    token,
    expiresAt: String(field(envelope.Result, 'TokenExpiresAt') ?? ''),
    claims: decodeClaims(token),
  };
  writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf8');

  console.log(`[global-setup]   ✓ token cached, expires ${auth.expiresAt}\n`);
}

export default globalSetup;
