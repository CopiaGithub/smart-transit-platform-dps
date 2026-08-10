import { Component,Inject } from '@angular/core';
import {
MAT_DIALOG_DATA,
MatDialogModule,
MatDialogRef,
} from '@angular/material/dialog';
import { CdsButtonComponent } from '../cds-button/cds-button.component';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.css'],
  imports: [MatDialogModule, CdsButtonComponent],
})
export class ConfirmationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      hideCancel?: boolean;
    },
    private dialogRef: MatDialogRef<ConfirmationDialogComponent>,
  ) {}

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }

  closeModal() {
    this.dialogRef.close(false);
  }
}
