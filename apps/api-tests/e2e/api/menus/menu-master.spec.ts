import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqName } from '../../helpers/factory';
import { expectOk } from '../../helpers/http';

/**
 * A self-referencing navigation tree: ParentId null means a top-level item.
 *
 * MenuMasterUpdateModel is the one non-partial PATCH in this API — Name is checked and
 * OrderNo/IsActive are non-nullable with defaults, so a patch that omits OrderNo sets
 * it to 0 rather than leaving it alone. The patch below therefore sends both.
 */
runCrudSuite({
  entity: 'MenuMaster',
  create: () => ({
    name: uniqName('Transport Reports'),
    route: '/reports/transport',
    icon: 'bus',
    parentId: null,
    orderNo: 90,
    isActive: true,
  }),
  patch: (created) => ({ name: `${created['Name']} (renamed)`, orderNo: 91, isActive: true }),
  patchedField: 'orderNo',
  listFilters: ['isActive=true', 'parentId=3'],
});

test.describe('MenuMaster tree', () => {
  test('GET /parents lists the candidates for a ParentId', async ({ api }) => {
    const parents = await expectOk<Record<string, unknown>[]>(api, 'get', `${API}/MenuMaster/parents`);
    expect(Array.isArray(parents)).toBe(true);
    expect(parents.length).toBeGreaterThan(0);
  });

  test('GET /parents?excludeId omits that menu, so a cycle cannot be built', async ({ api }) => {
    const all = await expectOk<Record<string, unknown>[]>(api, 'get', `${API}/MenuMaster/parents`);
    const victim = field<number>(all[0], 'Id')!;

    const filtered = await expectOk<Record<string, unknown>[]>(
      api,
      'get',
      `${API}/MenuMaster/parents?excludeId=${victim}`,
    );
    expect(filtered.map((m) => field(m, 'Id')), 'excludeId did not remove the menu').not.toContain(victim);
  });

  test('the list reports each item\'s child count', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/MenuMaster?pageNumber=1&pageSize=100`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.length).toBeGreaterThan(0);
    expect(typeof field(rows[0], 'ChildCount')).toBe('number');
  });
});

test.describe.serial('MenuMaster bulk reorder', () => {
  skipIfWritesBlocked();

  let id: number;

  test('a throwaway menu is created', async ({ api }) => {
    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/MenuMaster`, {
      name: uniqName('Bulk Reorder Target'),
      route: '/reports/bulk',
      orderNo: 95,
      isActive: true,
    });
    id = field<number>(created, 'Id')!;
  });

  test('bulk-update reorders it', async ({ api }) => {
    // Each entry needs Name — the bulk contract validates the same fields as a single
    // update, so a payload of {id, orderNo} alone would blank the name.
    const row = await expectOk<Record<string, unknown>>(api, 'get', `${API}/MenuMaster/${id}`);

    await expectOk(api, 'patch', `${API}/MenuMaster/bulk-update`, [
      { id, name: field(row, 'Name'), route: field(row, 'Route'), orderNo: 96, isActive: true },
    ]);

    const after = await expectOk<Record<string, unknown>>(api, 'get', `${API}/MenuMaster/${id}`);
    expect(field(after, 'OrderNo')).toBe(96);
    expect(field(after, 'Name'), 'bulk-update blanked the name').toBe(field(row, 'Name'));
  });

  test('the throwaway menu is removed', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/MenuMaster/${id}`);
  });
});
