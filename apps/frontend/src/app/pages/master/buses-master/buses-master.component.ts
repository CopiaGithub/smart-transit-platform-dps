import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { BUSES_MASTER_CONFIG } from './buses-master.config';

@Component({
  selector: 'app-buses-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class BusesMasterComponent {
  readonly config = BUSES_MASTER_CONFIG;
}
