import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { DISPLAY_MASTER_CONFIG } from './display-master.config';

@Component({
  selector: 'app-display-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class DisplayMasterComponent {
  readonly config = DISPLAY_MASTER_CONFIG;
}
