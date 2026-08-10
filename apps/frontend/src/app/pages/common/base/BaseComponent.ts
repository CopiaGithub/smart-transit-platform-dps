import { DestroyRef, inject, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmationDialogComponent } from '../../../components/cds/confirmation-dialog/confirmation-dialog.component';
import { LoaderDialogComponent } from '../../../components/cds/loader-dialog/loader-dialog.component';
import { ApiError } from '../../../core/api/api.types';

/**
 * Shared plumbing for every page: the popup fields the template binds to, plus
 * spinner and confirmation helpers.
 *
 * This deliberately carries more than the DMS original, where the same ~40 lines
 * of popup/spinner boilerplate were pasted into every one of ~40 master
 * components. Put it here once.
 *
 * Not a @Component/@Directive — a plain class using field-initialiser inject(),
 * which works because subclasses are constructed in an injection context.
 */
export class BaseComponent {
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly dialog = inject(MatDialog);

  // Bound by the <app-popup> in each page template.
  //
  // Signals, not plain fields: this app runs zoneless (there is no zone.js in
  // the build at all), so a field mutated inside an RxJS subscribe would never
  // repaint the view.
  readonly popupHeading = signal('');
  readonly popupContent = signal('');
  readonly isPopupVisible = signal(false);
  readonly popupImage = signal('');
  readonly headingColor = signal('');
  readonly buttonColor = signal('');
  private callbackFunction?: () => void;

  onPopupClosed(): void {
    this.isPopupVisible.set(false);
    if (this.callbackFunction) {
      this.callbackFunction();
      this.callbackFunction = undefined;
    }
  }

  protected showSuccess(message: string, callback?: () => void): void {
    this.showPopup(
      'Message',
      message,
      'check.png',
      'bg-green-600',
      'border border-green-600 text-green-600',
      callback,
    );
  }

  /**
   * Always surfaces the server's own ErrorMessage. A generic
   * "something went wrong" hides the one piece of information the user needs.
   */
  protected showError(error: unknown, fallback = 'Something went wrong.'): void {
    this.showPopup(
      'Message',
      resolveErrorMessage(error, fallback),
      'error.png',
      'bg-red-600',
      'border border-red-600 text-red-600',
    );
  }

  protected showWarning(message: string, callback?: () => void): void {
    this.showPopup(
      'Message',
      message,
      'warning.png',
      'bg-orange-500',
      'border border-orange-500 text-orange-500',
      callback,
    );
  }

  private showPopup(
    heading: string,
    content: string,
    imageUrl: string,
    headingColor: string,
    buttonColor: string,
    callback?: () => void,
  ): void {
    this.popupHeading.set(heading);
    this.popupContent.set(content);
    this.popupImage.set(imageUrl);
    this.headingColor.set(headingColor);
    this.buttonColor.set(buttonColor);
    this.callbackFunction = callback;
    this.isPopupVisible.set(true);
  }

  protected showSpinner(): MatDialogRef<LoaderDialogComponent> {
    return this.dialog.open(LoaderDialogComponent, { disableClose: true });
  }

  /** Emits true only when the user confirms. */
  protected confirm(
    title: string,
    message: string,
    confirmText?: string,
  ): Observable<boolean> {
    return this.dialog
      .open(ConfirmationDialogComponent, { data: { title, message, confirmText } })
      .afterClosed();
  }
}

/** ApiError already carries the server's message; everything else is best-effort. */
export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}
