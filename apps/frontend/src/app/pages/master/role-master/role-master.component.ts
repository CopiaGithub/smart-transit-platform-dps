import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { ROLE_MASTER_CONFIG } from './role-master.config';

@Component({
  selector: 'app-role-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class RoleMasterComponent {
  readonly config = ROLE_MASTER_CONFIG;
}
