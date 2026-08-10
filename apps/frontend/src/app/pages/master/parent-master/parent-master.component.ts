import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { PARENT_MASTER_CONFIG } from './parent-master.config';

@Component({
  selector: 'app-parent-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class ParentMasterComponent {
  readonly config = PARENT_MASTER_CONFIG;
}
