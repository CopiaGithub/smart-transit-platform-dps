import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { STUDENT_MASTER_CONFIG } from './student-master.config';

@Component({
  selector: 'app-student-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class StudentMasterComponent {
  readonly config = STUDENT_MASTER_CONFIG;
}
