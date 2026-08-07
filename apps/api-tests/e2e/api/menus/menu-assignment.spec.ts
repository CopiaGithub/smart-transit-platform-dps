import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { expectOk } from '../../helpers/http';

/** Which menus each role can see. */
test.describe('MenuAssignment reads', () => {
  test('GET /menus returns the full nested tree', async ({ api }) => {
    const tree = await expectOk<Record<string, unknown>[]>(api, 'get', `${API}/MenuAssignment/menus`);
    expect(Array.isArray(tree)).toBe(true);
    expect(tree.length, 'the seeded navigation is empty').toBeGreaterThan(0);
  });

  test('GET /assigned/{roleId} returns a flat id list', async ({ api }) => {
    const roles = await expectOk<PagedResult>(api, 'get', `${API}/RoleMaster?pageNumber=1&pageSize=25`);
    const roleId = field<number>(items(roles)[0], 'Id')!;

    const ids = await expectOk<number[]>(api, 'get', `${API}/MenuAssignment/assigned/${roleId}`);
    expect(Array.isArray(ids)).toBe(true);
    for (const id of ids) expect(typeof id).toBe('number');
  });

  test('GET /assigned-menus/{roleId} returns the tree that role renders', async ({ api }) => {
    const roles = await expectOk<PagedResult>(api, 'get', `${API}/RoleMaster?pageNumber=1&pageSize=25`);
    const roleId = field<number>(items(roles)[0], 'Id')!;

    const tree = await expectOk<Record<string, unknown>[]>(api, 'get', `${API}/MenuAssignment/assigned-menus/${roleId}`);
    expect(Array.isArray(tree)).toBe(true);
  });

  test('a role with no assignment gets an empty list, not an error', async ({ api }) => {
    const ids = await expectOk<number[]>(api, 'get', `${API}/MenuAssignment/assigned/999999999`);
    expect(ids ?? []).toHaveLength(0);
  });
});

test.describe.serial('MenuAssignment assign-menus', () => {
  /**
   * assign-menus REPLACES the role's entire menu set with the ids supplied — anything
   * not listed is removed. Getting this wrong strips a real role's navigation, so the
   * test reads the current set, writes back exactly that set, and asserts nothing moved.
   * A no-op is the only safe way to exercise a destructive replace on shared data.
   */
  skipIfWritesBlocked();

  let roleId: number;
  let before: number[];

  test('the current assignment is captured', async ({ api }) => {
    const roles = await expectOk<PagedResult>(api, 'get', `${API}/RoleMaster?pageNumber=1&pageSize=25`);
    roleId = field<number>(items(roles)[0], 'Id')!;
    before = await expectOk<number[]>(api, 'get', `${API}/MenuAssignment/assigned/${roleId}`);
    expect(before.length, 'the chosen role has no menus, so a replace proves nothing').toBeGreaterThan(0);
  });

  test('re-assigning the identical set leaves it unchanged', async ({ api }) => {
    await expectOk(api, 'post', `${API}/MenuAssignment/assign-menus`, { roleId, menuIds: before });

    const after = await expectOk<number[]>(api, 'get', `${API}/MenuAssignment/assigned/${roleId}`);
    expect([...after].sort(), 'a no-op replace changed the assignment').toEqual([...before].sort());
  });
});
