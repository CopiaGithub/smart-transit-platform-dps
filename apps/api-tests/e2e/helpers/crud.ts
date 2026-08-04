import type { APIRequestContext } from '@playwright/test';
import { API } from '../config/env';
import { expect, skipIfWritesBlocked, test } from '../fixtures/api.fixture';
import { field, items, totalRecords, type PagedResult } from './envelope';
import { call, expectFail, expectOk } from './http';

/**
 * The parameterised CRUD runner. A new master costs ~6 lines of config, not a spec file.
 *
 * Unlike the DMS API this one is genuinely uniform — `ApiResponseWrapperFilter` gives
 * every action the same envelope, and every master controller was generated from the
 * same template:
 *
 *     list     GET    /api/{Entity}         → Result = PagedResult<T>
 *     getById  GET    /api/{Entity}/{id}    → Result = T           | 404 envelope
 *     create   POST   /api/{Entity}         → Result = T, StatusCode 201
 *     patch    PATCH  /api/{Entity}/{id}    → Result = true        | 404 envelope
 *     delete   DELETE /api/{Entity}/{id}    → Result = true (soft) | 404 envelope
 *
 * So the shape is asserted once, here, and a per-entity spec only supplies payloads.
 */
export interface CrudSpec {
  /** Route segment, e.g. 'GateMaster' → /api/GateMaster. */
  entity: string;
  /** Fresh create payload. Must be unique per run — see helpers/factory.ts. */
  create: () => Record<string, unknown>;
  /** Patch payload, given the row that create returned. */
  patch: (created: Record<string, unknown>) => Record<string, unknown>;
  /** Field on the created row that `patch` is expected to change, for the read-back. */
  patchedField: string;
  /** Extra query-string filters to exercise on the list endpoint, e.g. 'gateType=StudentExit'. */
  listFilters?: string[];
}

/** Id far beyond anything the seeder creates, used for the 404 paths. */
const MISSING_ID = 999_999_999;

export function runCrudSuite(spec: CrudSpec): void {
  const base = `${API}/${spec.entity}`;

  test.describe.serial(`${spec.entity} CRUD`, () => {
    // Creating rows against the shared dev database is opt-in only.
    skipIfWritesBlocked();

    let api: APIRequestContext;
    let id: number;
    let created: Record<string, unknown> = {};

    test.beforeAll(async ({ api: ctx }) => {
      api = ctx;
    });

    test(`POST ${base} creates a row and reports 201 inside the envelope`, async () => {
      const c = await call<Record<string, unknown>>(api, 'post', base, spec.create());

      // Every create action returns CreatedAtAction. The wrapper moves that 201 into
      // the body and sends HTTP 200 — so the HTTP status proves nothing, and the
      // envelope's StatusCode is the only evidence a row was actually created.
      expect(c.http, c.where).toBe(200);
      expect(c.env.Success, c.where).toBe(true);
      expect(c.env.StatusCode, c.where).toBe(201);

      const result = c.env.Result ?? {};
      const newId = field<number>(result, 'Id');
      expect(newId, `create returned no Id. Result: ${JSON.stringify(result).slice(0, 300)}`).toBeTruthy();
      id = newId!;
      created = result;
    });

    test(`GET ${base}/{id} returns the created row`, async () => {
      const row = await expectOk<Record<string, unknown>>(api, 'get', `${base}/${id}`);
      expect(field(row, 'Id')).toBe(id);
    });

    test(`GET ${base} pages and includes the created row`, async () => {
      const page = await expectOk<PagedResult>(api, 'get', `${base}?pageNumber=1&pageSize=200`);
      const rows = items<Record<string, unknown>>(page);

      expect(rows.length, 'list returned no Items').toBeGreaterThan(0);
      expect(totalRecords(page), 'list carried no TotalRecords').toBeGreaterThanOrEqual(rows.length);
      expect(field(page, 'PageNumber')).toBe(1);
      // Never assert an absolute count: soft deletes mean the table only ever grows.
      expect(rows.some((r) => field(r, 'Id') === id), `created row ${id} missing from the list`).toBe(true);
    });

    for (const filter of spec.listFilters ?? []) {
      test(`GET ${base}?${filter} is accepted`, async () => {
        const page = await expectOk<PagedResult>(api, 'get', `${base}?pageNumber=1&pageSize=25&${filter}`);
        expect(Array.isArray(items(page))).toBe(true);
      });
    }

    test(`PATCH ${base}/{id} applies a partial update`, async () => {
      const body = spec.patch(created);
      const result = await expectOk(api, 'patch', `${base}/${id}`, body);
      expect(result, 'patch should resolve to true').toBe(true);

      const row = await expectOk<Record<string, unknown>>(api, 'get', `${base}/${id}`);
      expect(field(row, spec.patchedField)).toEqual(field(body, spec.patchedField));
    });

    test(`GET ${base}/${MISSING_ID} → 404 in the envelope, HTTP 200`, async () => {
      const env = await expectFail(api, 'get', `${base}/${MISSING_ID}`, 404);
      expect(env.ErrorMessage, 'a 404 should explain itself').toBeTruthy();
    });

    test(`DELETE ${base}/{id} soft-deletes`, async () => {
      // No teardown: the delete IS the assertion. The row stays in the table with
      // IsDeleted set, which is exactly what the API promises.
      const result = await expectOk(api, 'delete', `${base}/${id}`);
      expect(result, 'delete should resolve to true').toBe(true);
    });

    test(`GET ${base}/{id} after delete → 404`, async () => {
      await expectFail(api, 'get', `${base}/${id}`, 404);
    });

    test(`DELETE ${base}/{id} twice → 404, not a second success`, async () => {
      await expectFail(api, 'delete', `${base}/${id}`, 404);
    });
  });
}
