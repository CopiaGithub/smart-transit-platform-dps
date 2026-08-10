import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { PINCODE_MASTER_CONFIG } from './pincode-master.config';

@Component({
  selector: 'app-pincode-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class PincodeMasterComponent {
  readonly config = PINCODE_MASTER_CONFIG;
}
