import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { STUDENT_PARENT_MAPPING_CONFIG } from './student-parent-mapping.config';

@Component({
  selector: 'app-student-parent-mapping',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class StudentParentMappingComponent {
  readonly config = STUDENT_PARENT_MAPPING_CONFIG;
}
