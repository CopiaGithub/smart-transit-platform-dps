import { API } from '../../config/env';
import { expect, test } from '../../fixtures/api.fixture';
import { items, totalRecords, type PagedResult } from '../../helpers/envelope';
import { call, expectOk } from '../../helpers/http';

/**
 * Country / Region / State / City / PinCode are lookup lists for the parent address
 * fields. These controllers expose GET only — no POST, PATCH or DELETE action exists.
 * Nothing here writes, so the suite runs even with ALLOW_WRITES=0.
 */
const READ_ONLY = [
  { entity: 'CountryMaster', filters: [] as string[] },
  { entity: 'RegionMaster', filters: ['countryId=1'] },
  { entity: 'StateMaster', filters: ['countryId=1', 'regionId=1'] },
  { entity: 'CityMaster', filters: ['stateId=1', 'regionId=1'] },
  { entity: 'PinCodeMaster', filters: ['cityId=1'] },
];

test.describe('Geography lookups (read-only)', () => {
  for (const { entity, filters } of READ_ONLY) {
    test(`GET /api/${entity} returns a page`, async ({ api }) => {
      const page = await expectOk<PagedResult>(api, 'get', `${API}/${entity}?pageNumber=1&pageSize=25`);

      expect(Array.isArray(items(page)), `${entity} Result had no Items array`).toBe(true);
      expect(totalRecords(page), `${entity} carried no TotalRecords`).toBeGreaterThanOrEqual(0);
      expect(page.PageSize).toBe(25);
    });

    for (const filter of filters) {
      test(`GET /api/${entity}?${filter} is accepted`, async ({ api }) => {
        const page = await expectOk<PagedResult>(api, 'get', `${API}/${entity}?pageNumber=1&pageSize=25&${filter}`);
        expect(Array.isArray(items(page))).toBe(true);
      });
    }

    test(`POST /api/${entity} is not exposed`, async ({ api }) => {
      // No POST action exists, so routing rejects the verb. That never reaches MVC's
      // result filter, so it is a real HTTP status rather than a wrapped envelope.
      const res = await api.post(`${API}/${entity}`, { data: {} });
      expect([404, 405], `${entity} accepted a POST — a write action has appeared`).toContain(res.status());
    });
  }

  test('paging is honoured rather than silently ignored', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/CountryMaster?pageNumber=1&pageSize=1`);
    expect(items(page).length, 'pageSize=1 returned more than one row').toBeLessThanOrEqual(1);
    expect(page.PageSize).toBe(1);
  });

  test('a page beyond the end is empty, not an error', async ({ api }) => {
    const c = await call<PagedResult>(api, 'get', `${API}/CountryMaster?pageNumber=9999&pageSize=25`);
    expect(c.env.Success, c.where).toBe(true);
    expect(items(c.env.Result), 'page 9999 should be empty').toHaveLength(0);
  });
});
