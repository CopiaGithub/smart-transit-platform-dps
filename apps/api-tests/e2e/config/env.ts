import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Config comes from .env.test (gitignored). A ~15-line loader instead of pulling in
 * `dotenv` — this is all `dotenv` would do for us here. Real process env always wins,
 * so CI can override without editing the file.
 */
function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export const PROJECT_ROOT = resolve(__dirname, '..', '..');
export const E2E_ROOT = resolve(__dirname, '..');
export const AUTH_DIR = resolve(E2E_ROOT, '.auth');

loadEnvFile(resolve(PROJECT_ROOT, '.env.test'));

/**
 * API_BASE_URL must NOT carry a trailing `/api`. Every route in this suite is written
 * as `/api/Xxx`; a trailing `/api` here yields `/api/api/Xxx`, which the API answers
 * with a 404 envelope that reads exactly like a missing endpoint. Fail in global setup
 * instead, where the message is actionable.
 */
export function assertNoTrailingApi(baseUrl: string): void {
  if (/\/api\/?$/i.test(baseUrl)) {
    throw new Error(
      `API_BASE_URL must not include a trailing /api. Got: ${baseUrl}\n` +
        '  Every route in this suite already starts with /api.',
    );
  }
}

const stripTrailingSlash = (u: string): string => u.replace(/\/+$/, '');

/**
 * Default is the `https` launch profile. Program.cs calls UseHttpsRedirection()
 * unconditionally — including in Development — so an http:// base URL is answered
 * with a 307 to the https port, and the dev certificate is self-signed. Hence
 * ignoreHTTPSErrors on every context in this suite.
 */
const baseURL = stripTrailingSlash(process.env['API_BASE_URL'] ?? 'https://localhost:7074');

/**
 * When the API is hosted as an IIS sub-application the base URL carries a path prefix.
 * Playwright resolves a relative URL with `new URL(path, baseURL)`, and a path starting
 * with '/' REPLACES the whole base path — so `baseURL: 'https://host/tdpapi'` plus
 * `.post('/api/Auth/login')` silently drops the prefix. Build every route off `API`.
 */
function pathOf(u: string): string {
  try {
    return new URL(u).pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export const BASE_PATH = pathOf(baseURL);

/** Route prefix for every request: `api.get(`${API}/GateMaster`)`. */
export const API = `${BASE_PATH}/api`;

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Writes are opt-in, and the reason is the database, not the API host.
 *
 * appsettings.json commits `Server=4.240.53.172;Database=transit_display_platform_dev`
 * — a SHARED dev SQL Server. Running `dotnet run` on your laptop still writes there.
 * Every DELETE in this API is soft (sets IsDeleted), so rows created by a test run are
 * never reclaimed; they just accumulate for everyone. The project's own Postman notes
 * say the same thing: point it at a local server, not the shared dev database.
 *
 * So: opt in explicitly with ALLOW_WRITES=1 once your API is on a database you own.
 */
const writesAllowed = process.env['ALLOW_WRITES'] === '1';

export const env = {
  baseURL,
  apiHost: hostOf(baseURL),
  writesAllowed,
  writeSkipReason:
    'Write suites are off. The API\'s committed connection string points at the SHARED ' +
    'dev SQL Server (4.240.53.172 / transit_display_platform_dev) and every delete is ' +
    'soft, so test rows would accumulate there forever. Point the API at your own ' +
    'database, then set ALLOW_WRITES=1 in .env.test.',
  username: process.env['LOGIN_USERNAME'] ?? 'EMP001',
  password: process.env['LOGIN_PASSWORD'] ?? '',
  /** Run-scoped suffix. Isolation comes from unique data, never from cleanup. */
  runId: process.env['RUN_ID'] ?? new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
} as const;

export type Env = typeof env;
