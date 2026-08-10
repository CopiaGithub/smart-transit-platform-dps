import { Routes } from '@angular/router';

/** Group B — Security and Navigation Masters (WEB-APP-SCREENS.docx). */
export const SECURITY_MASTER_ROUTES: Routes = [
  {
    path: 'role-master',
    loadComponent: () =>
      import('@pages/master/role-master/role-master.component').then(
        (m) => m.RoleMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/role-master' },
  },
  {
    path: 'user-master',
    loadComponent: () =>
      import('@pages/master/user-master/user-master.component').then(
        (m) => m.UserMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/user-master' },
  },
  {
    path: 'menu-master',
    loadComponent: () =>
      import('@pages/master/menu-master/menu-master.component').then(
        (m) => m.MenuMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/menu-master' },
  },
  {
    path: 'menu-assignment',
    loadComponent: () =>
      import('@pages/master/menu-assignment/menu-assignment.component').then(
        (m) => m.MenuAssignmentComponent,
      ),
    data: { menuRoute: 'mainlayout/master/menu-assignment' },
  },
];
