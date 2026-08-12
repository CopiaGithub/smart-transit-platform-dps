import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PageHeaderShellComponent } from './page-header-shell.component';
import { PageHeaderService } from '../../services/page-header.service';

describe('PageHeaderShellComponent', () => {
  let fixture: ComponentFixture<PageHeaderShellComponent>;
  let component: PageHeaderShellComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageHeaderShellComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    });

    fixture = TestBed.createComponent(PageHeaderShellComponent);
    component = fixture.componentInstance;

    // The header only renders once a page has claimed it.
    TestBed.inject(PageHeaderService).setHeader(component, { title: 'Dashboard' });
    fixture.detectChanges();

    // The session service polls on construction; let it answer.
    TestBed.inject(HttpTestingController)
      .match(() => true)
      .forEach((request) =>
        request.flush({ Success: true, Result: null, StatusCode: 200 }),
      );
  });

  it('keeps the account menu closed until it is asked for', () => {
    expect(component.isMenuOpen()).toBe(false);
  });

  it('opens on the account button and closes on a second press', () => {
    const event = new MouseEvent('click');
    component.toggleMenu(event);
    expect(component.isMenuOpen()).toBe(true);

    component.toggleMenu(event);
    expect(component.isMenuOpen()).toBe(false);
  });

  it('closes on a click anywhere else', () => {
    component.toggleMenu(new MouseEvent('click'));
    component.onDocumentClick();
    expect(component.isMenuOpen()).toBe(false);
  });

  it('closes on Escape', () => {
    component.toggleMenu(new MouseEvent('click'));
    component.onEscape();
    expect(component.isMenuOpen()).toBe(false);
  });
});
