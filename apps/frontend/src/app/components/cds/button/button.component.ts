import { CommonModule } from '@angular/common';
import { Component,Input,model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from '../../spinner/spinner.component';

@Component({
  selector: 'app-button',
  imports: [FormsModule, CommonModule, MatButtonModule, SpinnerComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'search' | 'newBtn' =
    'primary';
  @Input() buttonType: 'reset' | 'button' | 'submit' = 'button';
  isProcessing = model(false);
}
