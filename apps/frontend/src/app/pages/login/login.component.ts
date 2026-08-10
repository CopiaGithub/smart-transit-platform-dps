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
    // Placeholder — wire forgot-password page later
    this.popupHeading = 'Forgot Password';
    this.popupContent = 'Password reset is not configured yet.';
    this.HeadingColor = '#c8102e';
    this.buttonColor = '#c8102e';
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

    this.authService.login(username, password).subscribe({
      next: (response) => {
        if (response?.token && response?.user) {
          this.updateRememberedUsername(username);
          this.authService.saveAuthData(
            response.token,
            response.refreshToken,
            response.user,
            response.stateId ?? null,
            response.isPrinciple ?? false,
          );
          this.router.navigate(['/mainlayout']);
          return;
        }

        this.popupHeading = 'Login Failed';
        this.popupContent = response?.message || 'Invalid credentials.';
        this.HeadingColor = '#c8102e';
        this.buttonColor = '#c8102e';
        this.isPopupVisible = true;
      },
      error: () => {
        this.popupHeading = 'Login Failed';
        this.popupContent = 'Unable to sign in. Please try again.';
        this.HeadingColor = '#c8102e';
        this.buttonColor = '#c8102e';
        this.isPopupVisible = true;
      },
    });
  }
}
