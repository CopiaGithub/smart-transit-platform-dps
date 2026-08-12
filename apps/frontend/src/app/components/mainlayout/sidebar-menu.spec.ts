import { ROLE } from '../../services/auth/auth.service';
import { SIDEBAR_MENU, menuForRole } from './sidebar-menu';

describe('menuForRole', () => {
  it('gives an admin the whole tree', () => {
    const menu = menuForRole(SIDEBAR_MENU, ROLE.Admin);
    expect(menu.length).toBe(SIDEBAR_MENU.length);
  });

  it('leaves a teacher only the screens a teacher can open', () => {
    const menu = menuForRole(SIDEBAR_MENU, ROLE.Teacher);

    // Every master controller is Admin-only, so Home is all that is left.
    expect(menu.map((item) => item.name)).toEqual(['Home']);
  });

  it('shows nothing role-restricted to a session with no role', () => {
    const menu = menuForRole(SIDEBAR_MENU, undefined);
    expect(menu.map((item) => item.name)).toEqual(['Home']);
  });

  it('does not cost an admin the sidebar over casing or stray whitespace', () => {
    // role_master.RoleName is free text, typed by whoever created the row.
    for (const role of ['admin', 'ADMIN', ' Admin ']) {
      expect(menuForRole(SIDEBAR_MENU, role).length).toBe(SIDEBAR_MENU.length);
    }
  });

  it('drops a group once all of its children are dropped', () => {
    const tree = [
      {
        name: 'Group',
        children: [{ name: 'Secret', route: '/x', roles: [ROLE.Admin] }],
      },
    ];

    // An expandable group that opens onto nothing is worse than no group.
    expect(menuForRole(tree, ROLE.Teacher)).toEqual([]);
    expect(menuForRole(tree, ROLE.Admin).length).toBe(1);
  });
});
