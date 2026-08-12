import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';

import { CdsButtonComponent } from '../cds/cds-button/cds-button.component';
import { ConfirmationDialogComponent } from '../cds/confirmation-dialog/confirmation-dialog.component';
import { PageHeaderService } from '../../services/page-header.service';
import { DispersalSessionService } from '../../services/dispersal-session.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-page-header-shell',
  imports: [RouterLink, MatIconModule, CdsButtonComponent],
  templateUrl: './page-header-shell.component.html',
  styleUrl: './page-header-shell.component.css',
})
export class PageHeaderShellComponent {
  /** Read straight from the template — see the session pill in the markup. */
  readonly session = inject(DispersalSessionService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  /**
   * Identity comes from the JWT claims, which is the only place the app knows
   * the user from — the login response carries nothing but the token, and
   * UserMasterController is admin-only, so a teacher cannot read even their own
   * row. Everything in the menu below is therefore a claim.
   */
  private readonly user = this.auth.getUserData();

  readonly userName = this.user?.name ?? '';
  readonly roleName = this.user?.roleName ?? '';
  readonly emailId = this.user?.emailId ?? '';
  readonly employeeCode = this.user?.employeeCode ?? '';

  /** "System Administrator" -> "SA", for the avatar when there is no photo. */
  readonly initials = this.userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  readonly isMenuOpen = signal(false);

  toggleMenu(event: MouseEvent): void {
    // Stops the document listener below from closing it in the same click.
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  /** Anywhere outside the menu dismisses it, the way a menu is expected to. */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  goToProfile(): void {
    this.closeMenu();
    // TODO: point at the Profile screen (Group H) once it exists.
    this.router.navigate(['/mainlayout/home']);
  }

  /**
   * Moved up from the sidebar footer, which is where it used to live. Same
   * confirmation as before — signing out mid-dispersal because of a stray click
   * is worth one question.
   */
  logout(): void {
    this.closeMenu();

    this.dialog
      .open(ConfirmationDialogComponent, {
        data: { title: 'Confirm Logout', message: 'Are you sure you want to logout?' },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.auth.logout();
        this.router.navigate(['/login']);
      });
  }

  constructor(readonly header: PageHeaderService) {}
}
