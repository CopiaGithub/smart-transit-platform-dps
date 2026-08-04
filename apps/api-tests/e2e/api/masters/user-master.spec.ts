import { API } from '../../config/env';
import { expect, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqCode, uniqMobile, uniqName } from '../../helpers/factory';
import { expectOk } from '../../helpers/http';

/**
 * EmployeeCode and EmailId are both uniquely indexed (filtered on IsDeleted = 0), and
 * RoleId is left null on purpose so the suite does not depend on a seeded role id.
 */
runCrudSuite({
  entity: 'UserMaster',
  create: () => {
    const code = uniqCode('EMP');
    return {
      name: uniqName('Kavita Deshpande'),
      contact: uniqMobile(),
      emailId: `${code.toLowerCase()}@dpsnerul.test`,
      password: 'ChangeMe@123',
      address: 'Delhi Public School, Nerul',
      employeeCode: code,
      roleId: null,
      isActive: true,
    };
  },
  patch: () => ({ contact: uniqMobile() }),
  patchedField: 'contact',
  listFilters: ['isActive=true', 'roleId=1'],
});

test.describe('UserMaster password handling', () => {
  // Read-only on purpose — this is the assertion most worth running everywhere,
  // including against an environment where writes are blocked.
  test('the password is never echoed back on any read', async ({ api }) => {
    // Passwords are BCrypt-hashed server-side. UserMasterListModel has no password
    // field at all, and this is the assertion that keeps it that way — a hash leaking
    // into a list response is exactly the class of bug the MD5 → BCrypt work fixed.
    const page = await expectOk<PagedResult>(api, 'get', `${API}/UserMaster?pageNumber=1&pageSize=25`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.length, 'the seeder creates 8 users').toBeGreaterThan(0);

    for (const row of rows) {
      const keys = Object.keys(row).map((k) => k.toLowerCase());
      expect(keys, `user ${field(row, 'Id')} leaked a credential field`).not.toContain('password');
      expect(keys, `user ${field(row, 'Id')} leaked a credential field`).not.toContain('passwordhash');
    }
  });
});
