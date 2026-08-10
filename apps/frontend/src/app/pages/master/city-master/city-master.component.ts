import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { CITY_MASTER_CONFIG } from './city-master.config';

@Component({
  selector: 'app-city-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class CityMasterComponent {
  readonly config = CITY_MASTER_CONFIG;
}
