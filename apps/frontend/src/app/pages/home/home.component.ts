import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderService } from '../../services/page-header.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-placeholder p-4">
      <p class="text-gray-600">
        Welcome to Transit Display Platform. Use the left menu to navigate.
      </p>
      <p class="text-sm text-gray-400 mt-2">
        Basic structure scaffold — add feature pages under
        <code>src/app/pages</code>.
      </p>
    </div>
  `,
  styles: [
    `
      .home-placeholder {
        min-height: 200px;
      }
      code {
        background: #f1f5f9;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
      }
    `,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private header: PageHeaderService) {}

  ngOnInit(): void {
    this.header.setHeader(this, {
      title: 'Home',
      id: 'home',
      showButton: false,
      breadcrumbs: [{ label: 'Home', route: '/mainlayout/home' }],
    });
  }

  ngOnDestroy(): void {
    this.header.clearHeader(this);
  }
}
