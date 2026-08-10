import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { GATE_MASTER_CONFIG } from './gate-master.config';

@Component({
  selector: 'app-gate-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class GateMasterComponent {
  readonly config = GATE_MASTER_CONFIG;
}
