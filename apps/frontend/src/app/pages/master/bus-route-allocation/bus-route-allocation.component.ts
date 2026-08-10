import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { BUS_ROUTE_ALLOCATION_CONFIG } from './bus-route-allocation.config';

@Component({
  selector: 'app-bus-route-allocation',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class BusRouteAllocationComponent {
  readonly config = BUS_ROUTE_ALLOCATION_CONFIG;
}
