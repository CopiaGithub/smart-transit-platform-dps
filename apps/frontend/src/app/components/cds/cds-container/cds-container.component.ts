import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-cds-container',
  templateUrl: './cds-container.component.html',
  styleUrls: ['./cds-container.component.css'],
  imports: [CommonModule, MatIcon],
})
export class CdsContainerComponent implements OnInit {
  @Input() customClass = '';
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() collapsible: boolean = true;
  @Input() headerActions: string = '';

  isCollapsed = false;
  @Input() actionText: string = '';
  @Input() actionIcon: string = '';
  @Output() actionClicked = new EventEmitter<void>();

  @Input() secondaryIcon: string = '';
  @Input() secondaryIconTooltip: string = '';
  @Output() secondaryIconClick = new EventEmitter<void>();

  toggleCollapse(event?: Event) {
    event?.stopPropagation();
    event?.preventDefault();
    this.isCollapsed = !this.isCollapsed;
  }

  onActionClick(): void {
    this.actionClicked.emit();
  }

  onSecondaryIconClick() {
    this.secondaryIconClick.emit();
  }

  ngOnInit() {}
}
