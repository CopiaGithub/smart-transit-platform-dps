import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { PopupComponent } from '../../components/popup/popup.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, CommonModule, PopupComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  appTitle = 'Transit Display';
  private readonly rememberedUsernameKey = 'rememberedUsername';
  showPassword = false;
  isSubmitting = false;

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
    if (this.formgroup.invalid) {
      this.formgroup.markAllAsTouched();
      return;
    }

    const username = this.formgroup.value.username!;
    const password = this.formgroup.value.password!;

    this.isSubmitting = true;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.updateRememberedUsername(username);
        this.router.navigate(['/mainlayout']);
      },
      // Show the server's own message ("Invalid username or password.") rather
      // than a generic failure.
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.popupHeading = 'Login Failed';
        this.popupContent =
          error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
        // "red" is what tells PopupComponent to render this as an error.
        this.HeadingColor = 'bg-red-600';
        this.buttonColor = 'border border-red-600 text-red-600';
        this.isPopupVisible = true;
      },
    });
  }
}
