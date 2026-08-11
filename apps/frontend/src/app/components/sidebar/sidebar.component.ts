import {
  Component,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  resolveSidebarMenuIcon,
} from './sidebar-menu-icons';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { filter } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../cds/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  animations: [
    trigger('submenuAnimation', [
      state(
        'hidden',
        style({
          opacity: 0,
          transform: 'translateY(10px)',
          display: 'none',
        }),
      ),
      state(
        'visible',
        style({
          opacity: 1,
          transform: 'translateY(0)',
          display: 'block',
        }),
      ),
      transition('hidden => visible', [
        style({ display: 'block' }),
        animate('200ms ease-in-out'),
      ]),
      transition('visible => hidden', [
        animate(
          '150ms ease-in-out',
          style({
            opacity: 0,
            transform: 'translateY(10px)',
          }),
        ),
      ]),
    ]),
  ],
})
export class SidebarComponent implements OnInit, OnChanges {
  userName: string = '';
  previewUrl: string | null = null;
  appTitle: string = 'Transit Display';
  @Input() isTablet: boolean = false;
  @Input() isCollapsed: boolean = false;
  @Input() menuItems: any[] = [];
  @Output() collapsedChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();
  activeMenuIndex: number | null = null;
  private selectedMenuItem: any = null;
  private activeBranchRoot: any | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private elRef: ElementRef,
    private dialog: MatDialog,
    private authService: AuthService,
  ) {}

  ngOnChanges() {
    this.initializeMenuItems(this.menuItems);
    this.expandActiveMenuPath();
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserData()?.name ?? '';

    this.expandActiveMenuPath();

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.expandActiveMenuPath());
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
  }

  showSubmenuOnHover(index: number): void {
    if (this.isCollapsed) this.activeMenuIndex = index;
  }

  logout() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  hideSubmenuOnLeave(): void {
    if (this.isCollapsed) this.activeMenuIndex = null;
  }

  navigateToRoute(route: string): void {
    if (route) {
      const menuItem = this.findMenuItemByRoute(route);
      if (menuItem) {
        this.setActiveBranchFromItem(menuItem);
      }
      this.clearSelectedMenuItemIfRouteActive();
      this.router.navigateByUrl(route).then(() => {
        this.expandActiveMenuPath();
      });
      if (this.isTablet) {
        this.isCollapsed = true;
        this.collapsedChange.emit(true);
      }
    }
  }

  openFirstChild(item: any): void {
    if (!item.children?.length) return;

    this.closeAllSubmenus();
    item.expanded = true;
    this.selectedMenuItem = item;
    this.setActiveBranchFromItem(item);

    const firstChild = this.findFirstRoutableMenuItem(item.children);
    if (firstChild?.route) {
      this.navigateToRoute(firstChild.route);
    }
  }

  get hasOpenDialog(): boolean {
    return this.dialog.openDialogs.length > 0;
  }

  isRouteActive(route: string): boolean {
    return this.isRouteActiveForMenu(route);
  }

  isRouteHighlighted(item: { route?: string }): boolean {
    return !!(
      item.route &&
      this.isInActiveBranch(item) &&
      this.isRouteActiveForMenu(item.route)
    );
  }

  private isRouteActiveForMenu(route: string): boolean {
    if (!route) return false;
    return this.normalizeRoutePath(route) === this.getEffectiveActiveRoute();
  }

  private getEffectiveActiveRoute(): string {
    let r: ActivatedRoute | null = this.route.root;
    let menuRoute: string | null = null;
    while (r) {
      const data = r.snapshot?.data;
      if (data && data['menuRoute']) {
        menuRoute = data['menuRoute'];
      }
      r = r.firstChild;
    }
    return this.normalizeRoutePath(menuRoute ?? this.router.url);
  }

  private normalizeRoutePath(path: string): string {
    return path.split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');
  }

  private static readonly KNOWN_SUFFIXES = [
    '-list',
    '-master',
    '-movement',
    '-report',
    '-entry',
  ];

  private pluralVariants(word: string): string[] {
    if (!word) return [];
    return word.endsWith('s') ? [word, word.slice(0, -1)] : [word, `${word}s`];
  }

  private getTopLevelAncestor(item: any): any | null {
    for (const top of this.menuItems) {
      if (top === item || this.isDescendantOf(item, top)) return top;
    }
    return null;
  }

  private isDescendantOf(item: any, ancestor: any): boolean {
    if (!ancestor?.children?.length) return false;
    if (ancestor.children.includes(item)) return true;
    return ancestor.children.some((child: any) =>
      this.isDescendantOf(item, child),
    );
  }

  private getBranchRoot(item: any): any {
    return this.getTopLevelAncestor(item) ?? item;
  }

  private setActiveBranchFromItem(item: any): void {
    this.activeBranchRoot = this.getBranchRoot(item);
  }

  private syncActiveBranchFromRoute(): void {
    for (const top of this.menuItems) {
      if (this.hasActiveRouteInBranch(top)) {
        this.activeBranchRoot = top;
        return;
      }
    }
  }

  private hasActiveRouteInBranch(item: any): boolean {
    if (item.route && this.isRouteActiveForMenu(item.route)) return true;
    if (!item.children?.length) return false;
    return item.children.some((child: any) =>
      this.hasActiveRouteInBranch(child),
    );
  }

  private isInActiveBranch(item: any): boolean {
    if (!this.activeBranchRoot) return true;
    return this.getBranchRoot(item) === this.activeBranchRoot;
  }

  private findMenuItemByRoute(
    route: string,
    items: any[] = this.menuItems,
  ): any | null {
    const target = this.normalizeRoutePath(route);
    for (const item of items) {
      if (item.route && this.normalizeRoutePath(item.route) === target) {
        return item;
      }
      if (item.children?.length) {
        const found = this.findMenuItemByRoute(route, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  private findFirstRoutableMenuItem(items: any[]): any | null {
    for (const item of items) {
      if (item.route) return item;

      if (item.children?.length) {
        const child = this.findFirstRoutableMenuItem(item.children);
        if (child) return child;
      }
    }

    return null;
  }

  isImmediateParentOfActiveRoute(item: any): boolean {
    if (!this.isInActiveBranch(item)) return false;
    if (!item.children?.length) return false;
    return item.children.some(
      (child: any) => child.route && this.isRouteActiveForMenu(child.route),
    );
  }

  isMenuItemActive(item: any): boolean {
    if (!this.isInActiveBranch(item)) return false;

    if (item.route && this.isRouteActiveForMenu(item.route)) return true;
    if (item.children?.length) {
      if (item.children.some((child: any) => this.isMenuItemActive(child))) {
        return true;
      }
    }
    return this.selectedMenuItem === item;
  }

  private clearSelectedMenuItemIfRouteActive(): void {
    const hasActiveRoute = (items: any[]): boolean => {
      for (const item of items) {
        if (item.route && this.isRouteActiveForMenu(item.route)) return true;
        if (item.children?.length && hasActiveRoute(item.children)) return true;
      }
      return false;
    };
    if (hasActiveRoute(this.menuItems)) {
      this.selectedMenuItem = null;
    }
  }

  private expandActiveMenuPath(): void {
    this.closeAllSubmenus();
    this.clearSelectedMenuItemIfRouteActive();
    const expandIfActive = (items: any[]): boolean => {
      for (const item of items) {
        if (item.route && this.isRouteActiveForMenu(item.route)) return true;
        if (item.children?.length && expandIfActive(item.children)) {
          item.expanded = true;
          return true;
        }
      }
      return false;
    };
    expandIfActive(this.menuItems);
    this.syncActiveBranchFromRoute();
  }

  isSubmenuOpen(index: number): boolean {
    return this.activeMenuIndex === index;
  }

  toggleLevel(item: any, siblings: any[]): void {
    if (!item.children?.length) return;

    const isTopLevel = siblings === this.menuItems;
    const willExpand = !item.expanded;

    if (isTopLevel) {
      if (willExpand) {
        this.closeAllSubmenus();
        item.expanded = true;
        this.selectedMenuItem = item;
        this.setActiveBranchFromItem(item);
      } else {
        item.expanded = false;
        this.collapseChildren(item);
        if (this.selectedMenuItem === item) {
          this.selectedMenuItem = null;
        }
        this.syncActiveBranchFromRoute();
      }
      return;
    }

    this.setActiveBranchFromItem(item);

    siblings.forEach((sibling) => {
      if (sibling !== item) {
        sibling.expanded = false;
        this.collapseChildren(sibling);
        if (this.selectedMenuItem === sibling) {
          this.selectedMenuItem = null;
        }
      }
    });
    item.expanded = !item.expanded;
    if (item.expanded) {
      this.selectedMenuItem = item;
    } else if (this.selectedMenuItem === item) {
      this.selectedMenuItem = null;
    }
  }

  private collapseChildren(item: any): void {
    if (!item.children?.length) return;

    item.children.forEach((child: any) => {
      child.expanded = false;
      this.collapseChildren(child);
    });
  }

  initializeMenuItems(items: any[]) {
    for (const item of items) {
      item.expanded = false;

      item.icon =
        item.icon && item.icon.trim() !== ''
          ? item.icon
          : resolveSidebarMenuIcon(item);

      if (item.children?.length) {
        this.initializeMenuItems(item.children);
      }
    }
  }

  closeAllSubmenus(): void {
    const collapse = (items: any[]) => {
      for (const item of items) {
        item.expanded = false;
        if (item.children?.length) collapse(item.children);
      }
    };

    collapse(this.menuItems);
    this.selectedMenuItem = null;
  }

  redirectToProfile(): void {
    // TODO: point at the Profile screen (Group H) once it exists.
    this.router.navigate(['/mainlayout/home']);
  }
}
