import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';

@Component({
  selector: 'cds-current-date',
  templateUrl: './cds-current-data.component.html',
  styleUrls: ['./cds-current-data.component.css'],
  imports: [CommonModule],
})
export class CdsCurrentDataComponent implements OnInit {
  today: string;

  constructor() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    this.today = now.toLocaleDateString('en-GB', options);
  }

  ngOnInit() {}
}
