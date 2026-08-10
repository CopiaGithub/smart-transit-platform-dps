import { Component } from '@angular/core';
import { MasterPageComponent } from '../master-page/master-page.component';
import { ACADEMIC_YEAR_MASTER_CONFIG } from './academic-year-master.config';

@Component({
  selector: 'app-academic-year-master',
  standalone: true,
  imports: [MasterPageComponent],
  template: `<app-master-page [config]="config"></app-master-page>`,
})
export class AcademicYearMasterComponent {
  readonly config = ACADEMIC_YEAR_MASTER_CONFIG;
}
