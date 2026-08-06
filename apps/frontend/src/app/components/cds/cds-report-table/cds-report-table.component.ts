import { CommonModule } from '@angular/common';
import { Component,forwardRef,Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ControlValueAccessorDirective } from '../../directive';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'cds-report-table',
  templateUrl: './cds-report-table.component.html',
  styleUrls: ['./cds-report-table.component.css'],
  imports: [CommonModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsReportTableComponent),
      multi: true,
    },
  ],
})
export class CdsReportTableComponent<
  T
> extends ControlValueAccessorDirective<T> {
  @Input() headers: { key: string; label: string }[] = [];
  @Input() data: any[] = [];
  @Input() tableHeight: string = '';
  @Input() enableHorizontalScroll: boolean = false;

  get tableWrapperStyle() {
    const styles: { [key: string]: string } = {};

    if (this.tableHeight) {
      styles['height'] = this.tableHeight;
      styles['overflow-y'] = 'auto';
    }

    if (this.enableHorizontalScroll) {
      styles['overflow-x'] = 'auto';
    }

    return styles;
  }
}
