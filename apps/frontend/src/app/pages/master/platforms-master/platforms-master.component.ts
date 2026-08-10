import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { PLATFORMS_MASTER_CONFIG } from './platforms-master.config';

@Component({
  selector: 'app-platforms-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class PlatformsMasterComponent {
  readonly config = PLATFORMS_MASTER_CONFIG;
}
