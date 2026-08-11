import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PageHeaderShellComponent } from '../page-header-shell/page-header-shell.component';
import { PageBreadcrumbService } from '../../services/page-breadcrumb.service';

@Component({
  selector: 'app-mainlayout',
  standalone: true,
  templateUrl: './mainlayout.component.html',
  styleUrls: ['./mainlayout.component.css'],
  imports: [
    CommonModule,
    SidebarComponent,
    RouterOutlet,
    MatIconModule,
    PageHeaderShellComponent,
  ],
})
export class MainlayoutComponent implements OnInit {
  /**
   * Static menu for now. It will be replaced by the role-assigned tree from
   * GET /api/MenuAssignment/assigned-menus/{roleId} — the sidebar already
   * renders whatever shape it is handed, so only the source changes.
   */
  sidebarMenu: any[] = [
    {
      name: 'Home',
      route: '/mainlayout/home',
      icon: 'home',
    },
    {
      name: 'Transport Masters',
      icon: 'directions_bus',
      children: [
        { name: 'Routes Master', route: '/mainlayout/master/routes-master' },
        { name: 'Buses Master', route: '/mainlayout/master/buses-master' },
        {
          name: 'Bus-Route Allocation',
          route: '/mainlayout/master/bus-route-allocation',
        },
      ],
    },
    {
      name: 'Infrastructure Masters',
      icon: 'meeting_room',
      children: [
        { name: 'Gate Master', route: '/mainlayout/master/gate-master' },
        { name: 'Platforms Master', route: '/mainlayout/master/platforms-master' },
        { name: 'Display Master', route: '/mainlayout/master/display-master' },
      ],
    },
    {
      name: 'Academic Masters',
      icon: 'school',
      children: [
        {
          name: 'Academic Year Master',
          route: '/mainlayout/master/academic-year-master',
        },
        { name: 'Student Master', route: '/mainlayout/master/student-master' },
        { name: 'Parent Master', route: '/mainlayout/master/parent-master' },
        {
          name: 'Student-Parent Mapping',
          route: '/mainlayout/master/student-parent-mapping',
        },
      ],
    },
    {
      name: 'Security & Navigation',
      icon: 'admin_panel_settings',
      children: [
        { name: 'Role Master', route: '/mainlayout/master/role-master' },
        { name: 'User Master', route: '/mainlayout/master/user-master' },
        { name: 'Menu Master', route: '/mainlayout/master/menu-master' },
        { name: 'Menu Assignment', route: '/mainlayout/master/menu-assignment' },
      ],
    },
    {
      name: 'Location Masters',
      icon: 'public',
      children: [
        { name: 'Country Master', route: '/mainlayout/master/country-master' },
        { name: 'Region Master', route: '/mainlayout/master/region-master' },
        { name: 'State Master', route: '/mainlayout/master/state-master' },
        { name: 'City Master', route: '/mainlayout/master/city-master' },
        { name: 'PinCode Master', route: '/mainlayout/master/pincode-master' },
      ],
    },
  ];

  sidebarCollapsed = false;
  isTablet = false;
  appTitle = 'Transit Display';

  constructor(
    private dialog: MatDialog,
    private breadcrumbService: PageBreadcrumbService,
  ) {}

  get hasOpenDialog(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  ngOnInit(): void {
    this.checkScreen();
    this.breadcrumbService.setMenuItems(this.sidebarMenu);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreen();
  }

  checkScreen(): void {
    const width = window.innerWidth;
    const wasTablet = this.isTablet;
    this.isTablet = width <= 1024;

    // Follow the breakpoint only when it actually changes. This runs on every
    // resize event, so assigning unconditionally would throw away a deliberate
    // collapse the moment the window moved, was zoomed, or devtools opened.
    if (this.isTablet !== wasTablet) {
      this.sidebarCollapsed = this.isTablet;
    }
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
