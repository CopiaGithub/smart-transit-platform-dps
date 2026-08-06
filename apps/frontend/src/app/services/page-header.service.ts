import { Injectable, signal } from '@angular/core';
import { BreadcrumbItem } from './page-breadcrumb.service';

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
  private owner: object | null = null;
  private actions: PageHeaderActions = {};

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
  }

  clearHeader(owner: object): void {
    if (this.owner !== owner) {
      return;
    }
    this.owner = null;
    this.actions = {};
    this.state.set(hiddenState);
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
