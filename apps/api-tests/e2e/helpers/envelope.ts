/**
 * The one contract every endpoint in this API shares — and the one trap.
 *
 * `ApiResponseWrapperFilter` rewrites EVERY controller result into
 *
 *     { Success, Result, StatusCode, ErrorMessage }
 *
 * and sets the HTTP status to 200 unconditionally. A 404, a 400 validation failure and
 * a 500 all arrive as `HTTP 200`. `expect(res.ok()).toBeTruthy()` therefore passes on
 * every possible failure — it asserts nothing at all. Read `body.Success` and
 * `body.StatusCode`; that is where the real outcome lives.
 *
 * Two documented exceptions where the HTTP status IS real, because the response never
 * reaches the MVC filter:
 *
 *   - Unauthenticated requests to an [Authorize] controller. AuthorizationMiddleware
 *     short-circuits before MVC, so you get a bare HTTP 401 with no envelope.
 *   - Anything the Kestrel/hosting layer rejects before routing.
 *
 * `ApiResponseMiddleware` does cover un-routed 404s, so a genuinely wrong URL still
 * comes back as a 200-wrapped envelope with StatusCode 404.
 *
 * Keys are PascalCase: Program.cs sets `PropertyNamingPolicy = null` precisely so the
 * envelope contract is stable. `field()` is case-tolerant anyway, so a serialiser
 * change degrades to a readable failure instead of silently null assertions.
 */

export interface ApiEnvelope<T = unknown> {
  Success: boolean;
  Result: T | null;
  StatusCode: number;
  ErrorMessage: string | null;
}

/** `PagedResult<T>` — the shape every list endpoint puts in `Result`. */
export interface PagedResult<T = unknown> {
  Items: T[];
  TotalRecords: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
}

/** Case-tolerant property read: `field(o, 'Items')` also matches `items`. */
export function field<T = unknown>(obj: unknown, name: string): T | undefined {
  if (obj === null || typeof obj !== 'object') return undefined;
  const rec = obj as Record<string, unknown>;
  if (name in rec) return rec[name] as T;
  const lower = name.toLowerCase();
  for (const k of Object.keys(rec)) if (k.toLowerCase() === lower) return rec[k] as T;
  return undefined;
}

function preview(v: unknown): string {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return (s ?? String(v)).slice(0, 300);
}

/** True when the body carries the envelope's marker keys. */
export function isEnvelope(body: unknown): boolean {
  return (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    typeof field(body, 'Success') === 'boolean' &&
    typeof field(body, 'StatusCode') === 'number'
  );
}

/** Normalises a raw body into the envelope, throwing with the body on anything else. */
export function asEnvelope<T = unknown>(body: unknown): ApiEnvelope<T> {
  if (!isEnvelope(body)) {
    throw new Error(`Expected the { Success, Result, StatusCode, ErrorMessage } envelope, got: ${preview(body)}`);
  }
  return {
    Success: field<boolean>(body, 'Success')!,
    Result: (field<T>(body, 'Result') ?? null) as T | null,
    StatusCode: field<number>(body, 'StatusCode')!,
    ErrorMessage: field<string>(body, 'ErrorMessage') ?? null,
  };
}

/**
 * One-line description of an envelope, used as the assertion message everywhere.
 * Without it a failure reads "expected true, got false" and tells you nothing.
 */
export function describe(env: ApiEnvelope): string {
  return `Success=${env.Success} StatusCode=${env.StatusCode} ErrorMessage=${env.ErrorMessage ?? '(none)'}`;
}

/** `Result` of a list endpoint, normalised to an array whatever the paging shape. */
export function items<T = unknown>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const list = field<T[]>(result, 'Items');
  return Array.isArray(list) ? list : [];
}

export function totalRecords(result: unknown): number | undefined {
  const n = field<number>(result, 'TotalRecords');
  return typeof n === 'number' ? n : undefined;
}
