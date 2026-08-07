import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqYearName } from '../../helpers/factory';
import { expectOk } from '../../helpers/http';

runCrudSuite({
  entity: 'AcademicYearMaster',
  create: () => {
    // YearName is MaxLength(9) and uniquely indexed — "2040-2041" and nothing else
    // fits, so there is nowhere to put a run marker. See helpers/factory.ts.
    const { yearName, startDate, endDate } = uniqYearName();
    // isCurrent stays false: a filtered unique index allows exactly one current row,
    // and flipping it here would silently demote the real academic year for everyone.
    return { yearName, startDate, endDate, isCurrent: false, isActive: true };
  },
  // Extend the year by a fortnight. Derived from the row that was actually created,
  // not a literal: uniqYearName() picks a year anywhere in 2040-2089, and the service
  // rejects an EndDate that is not after the StartDate.
  patch: (created) => ({ endDate: `${String(created['EndDate']).slice(0, 4)}-05-15` }),
  patchedField: 'endDate',
  listFilters: ['isActive=true'],
});

test.describe('AcademicYearMaster /current', () => {
  test('GET current resolves the running year without knowing its id', async ({ api }) => {
    const year = await expectOk<Record<string, unknown>>(api, 'get', `${API}/AcademicYearMaster/current`);

    expect(field(year, 'Id'), 'no current academic year is set').toBeTruthy();
    expect(field(year, 'IsCurrent')).toBe(true);
    expect(String(field(year, 'YearName'))).toMatch(/^\d{4}-\d{4}$/);
  });

  test('exactly one row is current, as the filtered unique index promises', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/AcademicYearMaster?pageNumber=1&pageSize=200`);
    const current = items<Record<string, unknown>>(page).filter((y) => field(y, 'IsCurrent') === true);

    expect(current, `${current.length} rows are marked current; the index allows one`).toHaveLength(1);
  });
});

test.describe.serial('AcademicYearMaster promotion demotes the incumbent', () => {
  // Genuinely destructive: student creation falls back to whichever year is current,
  // so this suite promotes a throwaway year and then puts the real one back.
  skipIfWritesBlocked();

  let incumbentId: number;
  let throwawayId: number;

  test('promoting a new year clears the previous current flag', async ({ api }) => {
    const incumbent = await expectOk<Record<string, unknown>>(api, 'get', `${API}/AcademicYearMaster/current`);
    incumbentId = field<number>(incumbent, 'Id')!;

    const { yearName, startDate, endDate } = uniqYearName();
    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/AcademicYearMaster`, {
      yearName,
      startDate,
      endDate,
      isCurrent: false,
      isActive: true,
    });
    throwawayId = field<number>(created, 'Id')!;

    await expectOk(api, 'patch', `${API}/AcademicYearMaster/${throwawayId}`, { isCurrent: true });

    const nowCurrent = await expectOk<Record<string, unknown>>(api, 'get', `${API}/AcademicYearMaster/current`);
    expect(field(nowCurrent, 'Id'), 'the new year did not become current').toBe(throwawayId);

    const old = await expectOk<Record<string, unknown>>(api, 'get', `${API}/AcademicYearMaster/${incumbentId}`);
    expect(field(old, 'IsCurrent'), 'the previous year was not demoted').toBe(false);
  });

  test('the real academic year is restored', async ({ api }) => {
    // Not teardown-for-tidiness — leaving a throwaway year current would change which
    // year new students are assigned to for every other developer on this database.
    await expectOk(api, 'patch', `${API}/AcademicYearMaster/${incumbentId}`, { isCurrent: true });
    await expectOk(api, 'delete', `${API}/AcademicYearMaster/${throwawayId}`);

    const restored = await expectOk<Record<string, unknown>>(api, 'get', `${API}/AcademicYearMaster/current`);
    expect(field(restored, 'Id')).toBe(incumbentId);
  });
});
