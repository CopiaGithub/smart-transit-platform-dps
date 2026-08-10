import { Component,EventEmitter,Input,OnInit,Output } from '@angular/core';
import { CdsLabelComponent } from '../cds/cds-label/cds-label.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cds-toggle',
  templateUrl: './cds-toggle.component.html',
  styleUrls: ['./cds-toggle.component.css'],
  imports: [CdsLabelComponent, ReactiveFormsModule],
})
export class CdsToggleComponent implements OnInit {
  @Input() label = '';
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle() {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }

  constructor() {}

  ngOnInit() {}
}
