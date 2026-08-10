import { CommonModule } from '@angular/common';
import { Component,Input } from '@angular/core';

@Component({
  selector: 'cds-label',
  imports: [CommonModule],
  templateUrl: './cds-label.component.html',
  styleUrl: './cds-label.component.css',
})
export class CdsLabelComponent {
  @Input() public label = '';
  @Input() public id = '';
  @Input() public customLabel = '';
  @Input() public isAstRequired = true;
  @Input() public text = '';
  constructor() {
    this.id = 'lbl' + new Date().getDate().toString();
  }
}
