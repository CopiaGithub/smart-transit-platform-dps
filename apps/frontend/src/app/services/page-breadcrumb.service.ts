import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  route?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PageBreadcrumbService {
  private menuItems: any[] = [];
  private menuPath: BreadcrumbItem[] = [];
  private menuPathSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly menuPath$ = this.menuPathSubject.asObservable();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.refreshMenuPath());
  }

  setMenuItems(items: any[]): void {
    this.menuItems = items ?? [];
    this.refreshMenuPath();
  }

  getMenuPath(): BreadcrumbItem[] {
    return this.menuPath;
  }

  private refreshMenuPath(): void {
    this.menuPath = this.findMenuPath(this.menuItems, this.router.url) ?? [];
    this.menuPathSubject.next(this.menuPath);
  }

  private findMenuPath(
    items: any[],
    url: string,
    trail: BreadcrumbItem[] = [],
  ): BreadcrumbItem[] | null {
    for (const item of items) {
      const nextTrail = [...trail];
      if (item.name) {
        nextTrail.push({
          label: item.name,
          route: item.route ?? null,
        });
      }

      if (item.route && this.isRouteActiveForMenu(item.route, url)) {
        return nextTrail;
      }

      if (item.children?.length) {
        const childPath = this.findMenuPath(item.children, url, nextTrail);
        if (childPath) {
          return childPath;
        }
      }
    }

    return null;
  }

  private isRouteActiveForMenu(route: string, url: string): boolean {
    if (!route) return false;

    const normalizedRoute = this.normalizeRoutePath(route);
    const currentPath = this.normalizeRoutePath(url);

    if (currentPath === normalizedRoute) return true;
    if (this.router.isActive(route, false)) return true;

    return false;
  }

  private normalizeRoutePath(route: string): string {
    return route.split('?')[0].replace(/\/+$/, '');
  }
}
