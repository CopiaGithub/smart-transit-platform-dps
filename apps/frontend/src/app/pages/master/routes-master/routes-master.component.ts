import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { ROUTES_MASTER_CONFIG } from './routes-master.config';

@Component({
  selector: 'app-routes-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class RoutesMasterComponent {
  readonly config = ROUTES_MASTER_CONFIG;
}
