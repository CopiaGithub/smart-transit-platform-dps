import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CdsButtonComponent } from '../cds/cds-button/cds-button.component';

type PopupVariant = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, MatIconModule, CdsButtonComponent],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css',
})
export class PopupComponent implements AfterViewInit, OnDestroy {
  @Input() heading: string = 'Default Heading';
  @Input() content: string = 'Default content for the popup.';
  @Input() isVisible: boolean = false;
  @Input() imageUrl: string = '';
  @Input() headerBgColor: string = 'bg-blue-300';
  @Input() ButtonColor: string = '';
  callbackFunction?: () => void;
  @ViewChild('overlay', { static: true }) overlayElement!: ElementRef<HTMLElement>;
  @ViewChild('popup', { static: true }) popupElement!: ElementRef<HTMLElement>;
  @Output() closed = new EventEmitter<void>();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    this.renderer.appendChild(
      this.document.body,
      this.overlayElement.nativeElement,
    );
  }

  ngOnDestroy(): void {
    const overlay = this.overlayElement?.nativeElement;
    if (overlay?.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  get popupVariant(): PopupVariant {
    const bg = (this.headerBgColor || '').toLowerCase();
    const btn = (this.ButtonColor || '').toLowerCase();

    if (bg.includes('green') || btn.includes('green')) {
      return 'success';
    }
    if (bg.includes('red') || btn.includes('red')) {
      return 'error';
    }
    if (
      bg.includes('yellow') ||
      bg.includes('orange') ||
      bg.includes('warning') ||
      btn.includes('yellow') ||
      btn.includes('orange')
    ) {
      return 'warning';
    }
    return 'info';
  }

  get iconName(): string {
    switch (this.popupVariant) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  get useCustomIcon(): boolean {
    return (
      !!this.imageUrl &&
      !['check.png', 'error.png', 'warning.png'].includes(this.imageUrl)
    );
  }

  get okButtonVariant(): 'primary' | 'danger' | 'success' {
    if (this.popupVariant === 'error') {
      return 'danger';
    }
    if (this.popupVariant === 'success') {
      return 'success';
    }
    return 'primary';
  }

  closePopup() {
    this.isVisible = false;
    this.closed.emit();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.isVisible) {
      return;
    }

    const targetElement = event.target as HTMLElement;
    if (
      this.popupElement &&
      this.popupElement.nativeElement &&
      !this.popupElement.nativeElement.contains(targetElement)
    ) {
      this.closePopup();
    }
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
}
