import { Routes } from '@angular/router';

/**
 * Group F — Operations screens (WEB-APP-SCREENS.docx).
 *
 * These sit beside `master/` rather than under it: nothing here is CRUD over a
 * master table, so none of them go through MasterPageComponent.
 */
export const OPERATIONS_ROUTES: Routes = [
  {
    path: 'reports',
    loadComponent: () =>
      import('@pages/reports/reports.component').then((m) => m.ReportsComponent),
    data: { menuRoute: 'mainlayout/reports' },
  },
];
