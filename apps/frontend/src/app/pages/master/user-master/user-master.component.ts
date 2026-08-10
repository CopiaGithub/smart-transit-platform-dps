import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { USER_MASTER_CONFIG } from './user-master.config';

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class UserMasterComponent {
  readonly config = USER_MASTER_CONFIG;
}
