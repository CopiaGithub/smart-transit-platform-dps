import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ConfirmationDialogComponent } from '../cds/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [CommonModule, MatIconModule],
})
export class HeaderComponent implements OnInit {
  userName: string = '';
  previewUrl: string | null = null;
  currentDate: string = '';
  showMenu: boolean = false;
  constructor(private router: Router, private authService: AuthService, private dialog: MatDialog) { }

  logout() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
    this.userName = this.authService.getUserData()?.name ?? '';
    this.currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}
