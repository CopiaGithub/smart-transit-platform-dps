import { ROLE } from '../../services/auth/auth.service';

export interface SidebarMenuItem {
  name: string;
  route?: string;
  icon?: string;
  /**
   * Roles allowed to see this item. Omitted means every signed-in role.
   *
   * This mirrors the server's [Authorize] attributes — it does not enforce
   * anything. Hiding a menu item a role cannot use is a courtesy, not a control;
   * the API is what refuses the data.
   */
  roles?: string[];
  children?: SidebarMenuItem[];
}

/** Every master screen is [Authorize(Roles = Admin)] on the server. */
const ADMIN_ONLY = [ROLE.Admin];

/**
 * The sidebar, with the role each entry is meant for.
 *
 * Still a static tree — it will be replaced by the role-assigned tree from
 * GET /api/MenuAssignment/assigned-menus/{roleId}. Until then the roles are
 * declared here so a non-admin is not shown 20 screens that answer 403.
 */
export const SIDEBAR_MENU: SidebarMenuItem[] = [
  {
    // The one screen every role can actually use.
    name: 'Home',
    route: '/mainlayout/home',
    icon: 'home',
  },
  {
    // The day's audit trail. Admin-only here, which is narrower than the mobile
    // app — navigation/menu.tsx shows Reports to a teacher as well. The web
    // console is the admin's tool; widen this if teachers are given web logins.
    name: 'Reports',
    route: '/mainlayout/reports',
    icon: 'assessment',
    roles: ADMIN_ONLY,
  },
  {
    name: 'Transport Masters',
    icon: 'directions_bus',
    roles: ADMIN_ONLY,
    children: [
      { name: 'Routes Master', route: '/mainlayout/master/routes-master' },
      { name: 'Buses Master', route: '/mainlayout/master/buses-master' },
      {
        name: 'Bus-Route Allocation',
        route: '/mainlayout/master/bus-route-allocation',
      },
    ],
  },
  {
    name: 'Infrastructure Masters',
    icon: 'meeting_room',
    roles: ADMIN_ONLY,
    children: [
      { name: 'Gate Master', route: '/mainlayout/master/gate-master' },
      { name: 'Platforms Master', route: '/mainlayout/master/platforms-master' },
      { name: 'Display Master', route: '/mainlayout/master/display-master' },
    ],
  },
  {
    name: 'Academic Masters',
    icon: 'school',
    roles: ADMIN_ONLY,
    children: [
      {
        name: 'Academic Year Master',
        route: '/mainlayout/master/academic-year-master',
      },
      { name: 'Student Master', route: '/mainlayout/master/student-master' },
      { name: 'Parent Master', route: '/mainlayout/master/parent-master' },
      {
        name: 'Student-Parent Mapping',
        route: '/mainlayout/master/student-parent-mapping',
      },
    ],
  },
  {
    name: 'Security & Navigation',
    icon: 'admin_panel_settings',
    roles: ADMIN_ONLY,
    children: [
      { name: 'Role Master', route: '/mainlayout/master/role-master' },
      { name: 'User Master', route: '/mainlayout/master/user-master' },
      { name: 'Menu Master', route: '/mainlayout/master/menu-master' },
      { name: 'Menu Assignment', route: '/mainlayout/master/menu-assignment' },
    ],
  },
  {
    name: 'Location Masters',
    icon: 'public',
    roles: ADMIN_ONLY,
    children: [
      { name: 'Country Master', route: '/mainlayout/master/country-master' },
      { name: 'Region Master', route: '/mainlayout/master/region-master' },
      { name: 'State Master', route: '/mainlayout/master/state-master' },
      { name: 'City Master', route: '/mainlayout/master/city-master' },
      { name: 'PinCode Master', route: '/mainlayout/master/pincode-master' },
    ],
  },
];

/**
 * The tree as one role sees it.
 *
 * A group is dropped once every child is dropped, so a role never gets an
 * expandable group that opens onto nothing.
 */
export function menuForRole(
  items: SidebarMenuItem[],
  role: string | undefined,
): SidebarMenuItem[] {
  // Compared loosely on purpose. The role is a free-text column in role_master
  // typed by whoever created the row, so "admin" or a trailing space must not
  // cost an administrator their entire sidebar.
  const current = role?.trim().toLowerCase();
  const allows = (roles: string[]) =>
    !!current && roles.some((allowed) => allowed.trim().toLowerCase() === current);

  return items
    .filter((item) => !item.roles || allows(item.roles))
    .map((item) => ({
      ...item,
      children: item.children ? menuForRole(item.children, role) : undefined,
    }))
    .filter((item) => !!item.route || !!item.children?.length);
}
