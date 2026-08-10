import { Routes } from '@angular/router';

/** Group D — Transport Masters (WEB-APP-SCREENS.docx). */
export const TRANSPORT_MASTER_ROUTES: Routes = [
  {
    path: 'routes-master',
    loadComponent: () =>
      import('@pages/master/routes-master/routes-master.component').then(
        (m) => m.RoutesMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/routes-master' },
  },
  {
    path: 'buses-master',
    loadComponent: () =>
      import('@pages/master/buses-master/buses-master.component').then(
        (m) => m.BusesMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/buses-master' },
  },
  {
    path: 'bus-route-allocation',
    loadComponent: () =>
      import('@pages/master/bus-route-allocation/bus-route-allocation.component').then(
        (m) => m.BusRouteAllocationComponent,
      ),
    data: { menuRoute: 'mainlayout/master/bus-route-allocation' },
  },
];
