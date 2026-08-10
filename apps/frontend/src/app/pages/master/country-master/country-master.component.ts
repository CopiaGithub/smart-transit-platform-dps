import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { COUNTRY_MASTER_CONFIG } from './country-master.config';

@Component({
  selector: 'app-country-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class CountryMasterComponent {
  readonly config = COUNTRY_MASTER_CONFIG;
}
