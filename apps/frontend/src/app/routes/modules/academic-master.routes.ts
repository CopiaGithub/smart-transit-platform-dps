import { Routes } from '@angular/router';

/** Group C — Academic Masters (WEB-APP-SCREENS.docx). */
export const ACADEMIC_MASTER_ROUTES: Routes = [
  {
    path: 'academic-year-master',
    loadComponent: () =>
      import('@pages/master/academic-year-master/academic-year-master.component').then(
        (m) => m.AcademicYearMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/academic-year-master' },
  },
  {
    path: 'student-master',
    loadComponent: () =>
      import('@pages/master/student-master/student-master.component').then(
        (m) => m.StudentMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/student-master' },
  },
  {
    path: 'parent-master',
    loadComponent: () =>
      import('@pages/master/parent-master/parent-master.component').then(
        (m) => m.ParentMasterComponent,
      ),
    data: { menuRoute: 'mainlayout/master/parent-master' },
  },
  {
    path: 'student-parent-mapping',
    loadComponent: () =>
      import(
        '@pages/master/student-parent-mapping/student-parent-mapping.component'
      ).then((m) => m.StudentParentMappingComponent),
    data: { menuRoute: 'mainlayout/master/student-parent-mapping' },
  },
];
