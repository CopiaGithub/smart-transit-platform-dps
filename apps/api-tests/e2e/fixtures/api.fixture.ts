import { test as base, request, type APIRequestContext } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { env } from '../config/env';
import { AUTH_FILE, type CachedAuth } from '../global-setup';

export type { CachedAuth };

export function readAuth(): CachedAuth {
  if (!existsSync(AUTH_FILE)) {
    throw new Error(`No cached token at ${AUTH_FILE} — see the [global-setup] output above.`);
  }
  return JSON.parse(readFileSync(AUTH_FILE, 'utf8')) as CachedAuth;
}

type WorkerFixtures = {
  /** Bearer-authenticated context. The token comes from global setup — never log in here. */
  api: APIRequestContext;
  /** No Authorization header. For the 401 tests and the [AllowAnonymous] endpoints. */
  anon: APIRequestContext;
  /** The cached login payload, for asserting on claims. */
  auth: CachedAuth;
};

// ignoreHTTPSErrors on every context: UseHttpsRedirection() is unconditional in
// Program.cs and the local dev certificate is self-signed.
const common = { baseURL: env.baseURL, ignoreHTTPSErrors: true } as const;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- no test-scoped fixtures; all three are worker-scoped.
type NoTestFixtures = {};

export const test = base.extend<NoTestFixtures, WorkerFixtures>({
  api: [
    async ({}, use) => {
      const ctx = await request.newContext({
        ...common,
        extraHTTPHeaders: {
          Authorization: `Bearer ${readAuth().token}`,
          Accept: 'application/json',
        },
      });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  anon: [
    async ({}, use) => {
      const ctx = await request.newContext({ ...common, extraHTTPHeaders: { Accept: 'application/json' } });
      await use(ctx);
      await ctx.dispose();
    },
    { scope: 'worker' },
  ],

  auth: [
    async ({}, use) => {
      await use(readAuth());
    },
    { scope: 'worker' },
  ],
});

export const { expect } = test;

/**
 * Guard at the top of every suite that creates, patches or deletes:
 *
 *     test.describe('...', () => { skipIfWritesBlocked(); ... })
 *
 * See config/env.ts for why — the committed connection string is a shared dev server
 * and every delete is soft.
 */
export function skipIfWritesBlocked(): void {
  test.skip(!env.writesAllowed, env.writeSkipReason);
}
