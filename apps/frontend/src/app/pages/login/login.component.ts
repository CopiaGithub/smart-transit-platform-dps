import { Component, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { PopupComponent } from '../../components/popup/popup.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, PopupComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  appTitle = 'Transit Display';
  private readonly rememberedUsernameKey = 'rememberedUsername';
  showPassword = false;
  /** Signals, not plain fields: the app is zoneless, so state written from the
   *  login response callback only reaches the template through a signal. */
  readonly isSubmitting = signal(false);
  /** Set once the user has attempted a submit, so errors appear on submit too
   *  and not only after a field has been touched and blurred. */
  readonly submitted = signal(false);
  /** Server-side failure, shown inline above the form. */
  readonly loginError = signal<string | null>(null);

  formgroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  });

  popupHeading = '';
  popupContent = '';
  isPopupVisible = false;
  popupImage = '';
  HeadingColor = '';
  buttonColor = '';
  popupConfirmLabel = '';
  callbackFunction?: () => void;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.getToken()) {
      this.router.navigate(['/mainlayout']);
      return;
    }

    const rememberedUsername = this.getRememberedUsername();
    if (rememberedUsername) {
      this.formgroup.patchValue({
        username: rememberedUsername,
        rememberMe: true,
      });
    }

    // A stale "invalid credentials" message next to fields the user is already
    // correcting is just noise, so drop it as soon as they start typing.
    this.formgroup.valueChanges.subscribe(() => {
      this.loginError.set(null);
    });
  }

  /** A field's error is shown once the user has blurred it or tried to submit. */
  hasError(field: 'username' | 'password'): boolean {
    const control = this.formgroup.get(field);
    return !!control?.invalid && (control.touched || this.submitted());
  }

  onPopupClosed(): void {
    this.isPopupVisible = false;
    this.popupConfirmLabel = '';
    this.callbackFunction = undefined;
  }

  onPopupConfirmed(): void {
    this.isPopupVisible = false;
    this.popupConfirmLabel = '';
    if (this.callbackFunction) {
      this.callbackFunction();
      this.callbackFunction = undefined;
    }
  }

  goToPassResetPage(_email: string | null): void {
    // Placeholder — wire forgot-password page later.
    // PopupComponent picks its variant by matching a colour word in these
    // strings, so they are class-style names, not hex. Nothing here is an
    // error, so it falls through to the neutral "info" styling.
    this.popupHeading = 'Forgot Password';
    this.popupContent = 'Password reset is not configured yet.';
    this.HeadingColor = '';
    this.buttonColor = '';
    this.isPopupVisible = true;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private getRememberedUsername(): string | null {
    try {
      return localStorage.getItem(this.rememberedUsernameKey);
    } catch {
      return null;
    }
  }

  private updateRememberedUsername(username: string): void {
    try {
      if (this.formgroup.value.rememberMe) {
        localStorage.setItem(this.rememberedUsernameKey, username);
      } else {
        localStorage.removeItem(this.rememberedUsernameKey);
      }
    } catch {
      // ignore storage errors
    }
  }

  onLogin(): void {
    this.submitted.set(true);
    this.loginError.set(null);

    if (this.formgroup.invalid || this.isSubmitting()) {
      this.formgroup.markAllAsTouched();
      return;
    }

    const username = this.formgroup.value.username!;
    const password = this.formgroup.value.password!;

    this.isSubmitting.set(true);

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.updateRememberedUsername(username);
        this.router.navigate(['/mainlayout']);
      },
      // Show the server's own message ("Invalid username or password.") rather
      // than a generic failure. Inline rather than in a popup: the user's next
      // action is to retype a field that is still on screen behind the dialog.
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.loginError.set(
          error instanceof Error
            ? error.message
            : 'Unable to sign in. Please try again.',
        );
      },
    });
  }
}
