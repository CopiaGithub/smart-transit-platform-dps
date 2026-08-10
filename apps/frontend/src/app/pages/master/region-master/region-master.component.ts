import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { REGION_MASTER_CONFIG } from './region-master.config';

@Component({
  selector: 'app-region-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class RegionMasterComponent {
  readonly config = REGION_MASTER_CONFIG;
}
