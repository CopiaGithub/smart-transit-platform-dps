import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { STATE_MASTER_CONFIG } from './state-master.config';

@Component({
  selector: 'app-state-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class StateMasterComponent {
  readonly config = STATE_MASTER_CONFIG;
}
