import { Routes } from '@angular/router';

/**
 * Group A — Location Masters (WEB-APP-SCREENS.docx).
 *
 * `data.menuRoute` is what SidebarComponent.getEffectiveActiveRoute() reads to
 * decide which sidebar item is highlighted.
 */
export const LOCATION_MASTER_ROUTES: Routes = [
  {
    path: 'country-master',
    loadComponent: () =>
      import('@pages/master/country-master/country-master.component').then(
        (m) => m.CountryMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/country-master' },
  },
  {
    path: 'region-master',
    loadComponent: () =>
      import('@pages/master/region-master/region-master.component').then(
        (m) => m.RegionMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/region-master' },
  },
  {
    path: 'state-master',
    loadComponent: () =>
      import('@pages/master/state-master/state-master.component').then(
        (m) => m.StateMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/state-master' },
  },
  {
    path: 'city-master',
    loadComponent: () =>
      import('@pages/master/city-master/city-master.component').then(
        (m) => m.CityMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/city-master' },
  },
  {
    path: 'pincode-master',
    loadComponent: () =>
      import('@pages/master/pincode-master/pincode-master.component').then(
        (m) => m.PincodeMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/pincode-master' },
  },
];
