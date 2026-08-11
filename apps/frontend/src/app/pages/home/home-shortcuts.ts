/**
 * The screens the dashboard links straight to.
 *
 * A deliberately short, hand-picked list — the point is to skip the sidebar for
 * the handful of screens opened all day, not to mirror it. Reordering or
 * swapping an entry is a one-line edit here; the template renders whatever this
 * array holds.
 *
 * Icons are named here rather than resolved through the sidebar's
 * resolveSidebarMenuIcon(). That table is inherited from another product and its
 * last rule is a catch-all `/\bmaster\b/i` → 'dataset'; because it matches on the
 * route as well as the label, every /master/* screen resolves to the same purple
 * 'dataset' icon. Tiles exist to be told apart at a glance, so they carry their
 * own. (The same catch-all is why the sidebar's children all look alike — fixing
 * it there would let this file drop the icon and accent fields again.)
 */
export interface HomeShortcut {
  /** Sidebar label for this screen. */
  name: string;
  /** Full router path, e.g. '/mainlayout/master/student-master'. */
  route: string;
  /** One short line under the label. */
  note: string;
  /** Material Icons ligature name. */
  icon: string;
  /** Accent colour for the icon tile. */
  accent: string;
}

export const HOME_SHORTCUTS: HomeShortcut[] = [
  {
    name: 'Student Master',
    route: '/mainlayout/master/student-master',
    note: 'Enrolment, transport and RFID',
    icon: 'school',
    accent: '#4f46e5',
  },
  {
    name: 'Parent Master',
    route: '/mainlayout/master/parent-master',
    note: 'Guardians and contact details',
    icon: 'family_restroom',
    accent: '#db2777',
  },
  {
    name: 'Student-Parent Mapping',
    route: '/mainlayout/master/student-parent-mapping',
    note: 'Who may collect which child',
    icon: 'link',
    accent: '#7c3aed',
  },
  {
    name: 'Buses Master',
    route: '/mainlayout/master/buses-master',
    note: 'Fleet, drivers and service state',
    icon: 'directions_bus',
    accent: '#0d9488',
  },
  {
    name: 'Routes Master',
    route: '/mainlayout/master/routes-master',
    note: 'Routes and their stops',
    icon: 'route',
    accent: '#0891b2',
  },
  {
    name: 'Bus-Route Allocation',
    route: '/mainlayout/master/bus-route-allocation',
    note: 'Who runs which route today',
    icon: 'alt_route',
    accent: '#ea580c',
  },
  {
    name: 'Display Master',
    route: '/mainlayout/master/display-master',
    note: 'LED walls and their status',
    icon: 'cast',
    accent: '#2563eb',
  },
  {
    name: 'Academic Year Master',
    route: '/mainlayout/master/academic-year-master',
    note: 'Sessions and the current year',
    icon: 'calendar_month',
    accent: '#059669',
  },
];
