import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import {
  BreadcrumbItem,
  PageBreadcrumbService,
} from '../../../services/page-breadcrumb.service';
import { PageHeaderService } from '../../../services/page-header.service';

@Component({
  selector: 'app-cds-title',
  standalone: true,
  templateUrl: './cds-title.component.html',
  styleUrls: ['./cds-title.component.css'],
  imports: [],
})
export class CdsTitleComponent implements OnInit, OnDestroy, OnChanges {
  private breadcrumbs: BreadcrumbItem[] = [];
  private routerSub?: Subscription;
  private menuSub?: Subscription;

  constructor(
    private breadcrumbService: PageBreadcrumbService,
    private headerService: PageHeaderService,
    private router: Router,
  ) {}

  @Input() title: string = '';
  @Input() buttonText: string = '';
  @Input() buttonIcon: string = '';
  @Input() showButton: boolean = true;
  @Input() showPrint: boolean = false;
  /** Shows cart icon in the page header shell. */
  @Input('showCart') showCart: boolean = false;
  /** Badge count shown on the cart icon. */
  @Input('cartCount') cartCount: number = 0;
  @Input() id: string = '';
  @Input() breadcrumbItems: BreadcrumbItem[] | null = null;

  @Output() buttonClick = new EventEmitter<void>();
  @Output() buttonPrintClick = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();

  ngOnInit(): void {
    this.syncHeader();
    this.menuSub = this.breadcrumbService.menuPath$.subscribe(() =>
      this.syncHeader(),
    );
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncHeader());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['title'] ||
      changes['breadcrumbItems'] ||
      changes['buttonText'] ||
      changes['buttonIcon'] ||
      changes['showButton'] ||
      changes['showPrint'] ||
      changes['showCart'] ||
      changes['cartCount'] ||
      changes['id']
    ) {
      this.syncHeader();
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.menuSub?.unsubscribe();
    this.headerService.clearHeader(this);
  }

  private syncHeader(): void {
    this.breadcrumbs = this.buildBreadcrumbs();
    this.headerService.setHeader(
      this,
      {
        title: this.title,
        buttonText: this.buttonText,
        buttonIcon: this.buttonIcon,
        showButton: this.showButton,
        showPrint: this.showPrint,
        showCart: this.showCart,
        cartCount: this.cartCount,
        id: this.id,
        breadcrumbs: this.breadcrumbs,
      },
      {
        onButtonClick: () => this.buttonClick.emit(),
        onPrintClick: () => this.buttonPrintClick.emit(),
        onCartClick: () => this.cartClick.emit(),
      },
    );
  }

  private buildBreadcrumbs(): BreadcrumbItem[] {
    if (this.breadcrumbItems?.length) {
      return this.breadcrumbItems;
    }

    const home: BreadcrumbItem = {
      label: 'Home',
      route: '/mainlayout/dashboard/dms-dashboards',
    };
    const menuPath = this.breadcrumbService.getMenuPath();
    const pageTitle = this.title?.trim();
    let trail = [...menuPath];

    if (pageTitle && trail.length) {
      const lastLabel = trail[trail.length - 1]?.label?.trim();
      if (lastLabel === pageTitle) {
        trail = trail.slice(0, -1);
      }
    }

    return [home, ...trail].filter((crumb) => !!crumb.label?.trim());
  }
}
