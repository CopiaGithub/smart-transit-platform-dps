import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ACADEMIC_MASTER_ROUTES } from './routes/modules/academic-master.routes';
import { INFRASTRUCTURE_MASTER_ROUTES } from './routes/modules/infrastructure-master.routes';
import { LOCATION_MASTER_ROUTES } from './routes/modules/location-master.routes';
import { SECURITY_MASTER_ROUTES } from './routes/modules/security-master.routes';
import { TRANSPORT_MASTER_ROUTES } from './routes/modules/transport-master.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'mainlayout',
    loadComponent: () =>
      import('./components/mainlayout/mainlayout.component').then(
        (m) => m.MainlayoutComponent,
      ),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'master',
        children: [
          ...TRANSPORT_MASTER_ROUTES,
          ...INFRASTRUCTURE_MASTER_ROUTES,
          ...SECURITY_MASTER_ROUTES,
          ...ACADEMIC_MASTER_ROUTES,
          ...LOCATION_MASTER_ROUTES,
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
