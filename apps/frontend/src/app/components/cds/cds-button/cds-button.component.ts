import { CommonModule } from '@angular/common';
import { Component, Input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerComponent } from '../../spinner/spinner.component';

@Component({
  selector: 'cds-button',
  imports: [
    FormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SpinnerComponent,
  ],
  templateUrl: './cds-button.component.html',
  styleUrl: './cds-button.component.css',
})
export class CdsButtonComponent {
  @Input() variant:
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'search'
    | 'clear'
    | 'newBtn'
    | 'success' = 'primary';
  @Input() buttonType: 'reset' | 'button' | 'submit' = 'button';
  @Input() disabled: boolean = false;
  @Input() testid: string = '';
  isProcessing = model(false);
  ngOnInit() {
    console.log('Button variant:', this.variant);
  }
}
