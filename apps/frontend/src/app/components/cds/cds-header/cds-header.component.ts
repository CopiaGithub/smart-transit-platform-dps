import { CommonModule } from '@angular/common';
import { Component,Input,OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
trigger,
state,
style,
animate,
transition,
} from '@angular/animations';
@Component({
  selector: 'app-cds-header',
  templateUrl: './cds-header.component.html',
  styleUrls: ['./cds-header.component.css'],
  imports: [MatIcon, CommonModule],
  animations: [
    trigger('expandCollapse', [
      state(
        'expanded',
        style({ height: '*', opacity: 1, padding: '*', margin: '*' })
      ),
      state(
        'collapsed',
        style({ height: '0px', opacity: 0, padding: '0', margin: '0' })
      ),
      transition('expanded <=> collapsed', animate('400ms ease-in-out')),
    ]),
  ],
})
export class CdsHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() toggle: boolean = false;
  isCollapsed = false;
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  constructor() { }

  ngOnInit() { }
}
