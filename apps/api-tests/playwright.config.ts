import { defineConfig } from '@playwright/test';
import { env } from './e2e/config/env';

/**
 * API-only Playwright suite for the Transit Display Platform .NET backend.
 * No browser tests — every spec uses the `request` fixture.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  globalSetup: './e2e/global-setup.ts',

  /**
   * Single worker, no parallelism — NON-NEGOTIABLE while there is one seeded login.
   *
   * AuthService counts FailedLoginAttempts per user and locks the account for 15
   * minutes at 5. Every worker shares EMP001, so parallel workers racing on the same
   * account is a self-inflicted lockout waiting to happen. Beyond auth, the CRUD
   * suites are ordered chains (create → patch → delete) over unique keys the schema
   * hardening now enforces; concurrent runs against the same shared database would
   * collide on them.
   *
   * Parallelism unlocks once each worker index has its own seeded UserMaster row.
   */
  workers: 1,
  fullyParallel: false,

  forbidOnly: !!process.env['CI'],
  // Deliberate: a retry that passes would hide a lockout or a unique-key collision.
  retries: 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: env.baseURL,
    /**
     * Program.cs calls UseHttpsRedirection() unconditionally — including in
     * Development — and the local dev certificate is self-signed. Without this
     * every request dies at the TLS handshake.
     */
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'retain-on-failure',
  },

  expect: { timeout: 10_000 },
  timeout: 60_000,

  projects: [
    {
      /** Read-only. Safe against the shared dev database. */
      name: 'smoke',
      testDir: './e2e/api/smoke',
    },
    {
      /** Everything. Write suites self-skip unless ALLOW_WRITES=1. */
      name: 'api',
      testDir: './e2e/api',
    },
  ],
});
