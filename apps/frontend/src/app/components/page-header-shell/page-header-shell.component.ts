import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CdsButtonComponent } from '../cds/cds-button/cds-button.component';
import { PageHeaderService } from '../../services/page-header.service';

@Component({
  selector: 'app-page-header-shell',
  imports: [RouterLink, MatIconModule, CdsButtonComponent],
  templateUrl: './page-header-shell.component.html',
  styleUrl: './page-header-shell.component.css',
})
export class PageHeaderShellComponent {
  constructor(readonly header: PageHeaderService) {}
}
