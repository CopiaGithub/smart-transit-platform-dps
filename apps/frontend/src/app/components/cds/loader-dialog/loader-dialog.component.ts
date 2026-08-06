import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { SpinnerComponent } from '../../spinner/spinner.component';

@Component({
  selector: 'app-loader-dialog',
  templateUrl: './loader-dialog.component.html',
  styleUrls: ['./loader-dialog.component.css'],
  imports: [SpinnerComponent, MatDialogModule],
})
export class LoaderDialogComponent {}
