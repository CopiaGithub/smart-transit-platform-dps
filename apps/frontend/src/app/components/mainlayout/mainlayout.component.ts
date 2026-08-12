import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PageHeaderShellComponent } from '../page-header-shell/page-header-shell.component';
import { PageBreadcrumbService } from '../../services/page-breadcrumb.service';
import { AuthService } from '../../services/auth/auth.service';
import { SIDEBAR_MENU, SidebarMenuItem, menuForRole } from './sidebar-menu';

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
   * The sidebar as this user's role sees it. Filled in ngOnInit, once the role
   * is known — see sidebar-menu.ts for the tree and who each entry is for.
   */
  sidebarMenu: SidebarMenuItem[] = [];

  sidebarCollapsed = false;
  isTablet = false;
  appTitle = 'Transit Display';

  constructor(
    private dialog: MatDialog,
    private breadcrumbService: PageBreadcrumbService,
    private auth: AuthService,
  ) {}

  get hasOpenDialog(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  ngOnInit(): void {
    this.checkScreen();
    // Breadcrumbs are fed the same filtered tree, so they never name a screen
    // this role cannot open.
    this.sidebarMenu = menuForRole(SIDEBAR_MENU, this.auth.getRole());
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
