import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BreadcrumbItem } from './page-breadcrumb.service';

/** Product name, and the tab title on its own when no page has claimed one. */
const APP_NAME = 'Transit Display';

export interface PageHeaderState {
  visible: boolean;
  title: string;
  buttonText: string;
  buttonIcon: string;
  showButton: boolean;
  showPrint: boolean;
  showCart: boolean;
  cartCount: number;
  id: string;
  breadcrumbs: BreadcrumbItem[];
}

export interface PageHeaderActions {
  onButtonClick?: () => void;
  onPrintClick?: () => void;
  onCartClick?: () => void;
}

const hiddenState: PageHeaderState = {
  visible: false,
  title: '',
  buttonText: '',
  buttonIcon: '',
  showButton: false,
  showPrint: false,
  showCart: false,
  cartCount: 0,
  id: '',
  breadcrumbs: [],
};

@Injectable({ providedIn: 'root' })
export class PageHeaderService {
  readonly state = signal<PageHeaderState>(hiddenState);
  private readonly title = inject(Title);
  private owner: object | null = null;
  private actions: PageHeaderActions = {};

  /** "Student Master · Transit Display" — where you are, then what you are in. */
  private setDocumentTitle(pageTitle?: string): void {
    const page = pageTitle?.trim();
    this.title.setTitle(page ? `${page} · ${APP_NAME}` : APP_NAME);
  }

  setHeader(
    owner: object,
    state: Partial<Omit<PageHeaderState, 'visible'>>,
    actions: PageHeaderActions = {},
  ): void {
    this.owner = owner;
    this.actions = actions;
    this.state.set({
      ...hiddenState,
      ...state,
      visible: !!state.title?.trim(),
      breadcrumbs: state.breadcrumbs ?? [],
    });
    this.setDocumentTitle(state.title);
  }

  clearHeader(owner: object): void {
    if (this.owner !== owner) {
      return;
    }
    this.owner = null;
    this.actions = {};
    this.state.set(hiddenState);
    this.setDocumentTitle();
  }

  triggerButtonClick(): void {
    this.actions.onButtonClick?.();
  }

  triggerPrintClick(): void {
    this.actions.onPrintClick?.();
  }

  triggerCartClick(): void {
    this.actions.onCartClick?.();
  }
}
