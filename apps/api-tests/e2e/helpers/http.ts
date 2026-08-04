import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { asEnvelope, describe, type ApiEnvelope } from './envelope';

export type Method = 'get' | 'post' | 'patch' | 'delete';

export interface Call<T = unknown> {
  /** Real HTTP status. Always 200 for anything that reaches a controller. */
  http: number;
  /** The parsed envelope. */
  env: ApiEnvelope<T>;
  /** Ready-made assertion message: method, url and the envelope's own verdict. */
  where: string;
}

/**
 * Bodies are parsed defensively rather than with `res.json()`.
 *
 * A bare 401 from AuthorizationMiddleware has an empty body, and `.json()` throws on
 * empty input — which surfaces as an opaque SyntaxError instead of "you were not
 * authenticated". Same for anything Kestrel rejects before routing.
 */
export async function raw(res: APIResponse): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Issues the request and returns the envelope. Asserts nothing — callers do that. */
export async function call<T = unknown>(
  api: APIRequestContext,
  method: Method,
  url: string,
  data?: unknown,
): Promise<Call<T>> {
  const res = await api[method](url, data === undefined ? undefined : ({ data } as never));
  const body = await raw(res);
  const env = asEnvelope<T>(body);
  return {
    http: res.status(),
    env,
    where: `${method.toUpperCase()} ${url} → HTTP ${res.status()} ${describe(env)}`,
  };
}

/**
 * The assertion this suite exists to make: the envelope says success, and the HTTP
 * status is the constant 200 the wrapper promises.
 */
export async function expectOk<T = unknown>(
  api: APIRequestContext,
  method: Method,
  url: string,
  data?: unknown,
): Promise<T> {
  const c = await call<T>(api, method, url, data);
  expect(c.http, c.where).toBe(200);
  expect(c.env.Success, c.where).toBe(true);
  expect(c.env.StatusCode, c.where).toBeGreaterThanOrEqual(200);
  expect(c.env.StatusCode, c.where).toBeLessThan(300);
  return c.env.Result as T;
}

/**
 * The negative form. `expectedStatus` is the code inside the envelope, not the HTTP
 * one — the HTTP status is still 200, and asserting on it would pass on every failure.
 */
export async function expectFail(
  api: APIRequestContext,
  method: Method,
  url: string,
  expectedStatus: number,
  data?: unknown,
): Promise<ApiEnvelope> {
  const c = await call(api, method, url, data);
  expect(c.http, c.where).toBe(200);
  expect(c.env.Success, c.where).toBe(false);
  expect(c.env.StatusCode, c.where).toBe(expectedStatus);
  expect(c.env.Result, c.where).toBeNull();
  return c.env;
}
