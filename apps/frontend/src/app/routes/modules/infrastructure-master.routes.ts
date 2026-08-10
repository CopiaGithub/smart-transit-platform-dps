import { Routes } from '@angular/router';

/** Group E — Infrastructure Masters (WEB-APP-SCREENS.docx). */
export const INFRASTRUCTURE_MASTER_ROUTES: Routes = [
  {
    path: 'gate-master',
    loadComponent: () =>
      import('@pages/master/gate-master/gate-master.component').then(
        (m) => m.GateMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/gate-master' },
  },
  {
    path: 'platforms-master',
    loadComponent: () =>
      import('@pages/master/platforms-master/platforms-master.component').then(
        (m) => m.PlatformsMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/platforms-master' },
  },
  {
    path: 'display-master',
    loadComponent: () =>
      import('@pages/master/display-master/display-master.component').then(
        (m) => m.DisplayMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/display-master' },
  },
];
