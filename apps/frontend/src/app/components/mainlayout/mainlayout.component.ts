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
  /** Static menu for basic scaffold — replace with role-assigned API later. */
  sidebarMenu: any[] = [
    {
      name: 'Home',
      route: '/mainlayout/home',
      icon: 'home',
    },
    {
      name: 'Masters',
      icon: 'folder',
      children: [
        {
          name: 'Sample Master',
          route: '/mainlayout/home',
          icon: 'list',
        },
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
    this.isTablet = width <= 1024;
    this.sidebarCollapsed = this.isTablet;
  }

  onSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
