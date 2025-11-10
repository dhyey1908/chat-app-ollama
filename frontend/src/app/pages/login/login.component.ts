import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private snackBar: MatSnackBar,
    private router: Router, private route: ActivatedRoute) { 
    this.route.queryParams.subscribe(params => {
      console.log('params: ', params);
      if (Object.keys(params).length === 0) {
        console.log('No params received, skipping Google callback');
        return;
      }
      const code = params['code'];
      if (code) {
        console.log('Received code:', code);
        this.handleGoogleCallback(code);
      } else {
        console.log('No code found in params');
      }
    });
  }

  login() {
    const data = { email: this.email, password: this.password }

    this.authService.loginUser(data).subscribe({
      next: (res: any) => {
        localStorage.setItem('email', this.email);
        localStorage.setItem('token', res.AuthenticationResult.AccessToken);
        this.showSnackBar('Login Successful', 'Close');
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.showSnackBar('Login Failed', 'Close');
      }
    });
  }

  showSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: "right",
      verticalPosition: "top"
    });
  }

  loginWithGoogle() {
    console.log('Starting Google login process...');
    try {
      this.authService.redirectToGoogle();
      sessionStorage.setItem('googleAuthInProgress', 'true');
      console.log('Redirecting to Google login...');
    } catch (error) {
      console.error('Failed to redirect to Google:', error);
      this.showSnackBar('Failed to start Google login', 'Close');
    }
  }

  private handleGoogleCallback(code: string) {
    console.log('Handling Google callback with code');
    if (!sessionStorage.getItem('googleAuthInProgress')) {
      console.warn('No Google auth was in progress, but received a callback');
    }

    this.authService.handleGoogleCallback(code).subscribe({
      next: (res: any) => {
        console.log('Google login response received:', res);
        if (res && res.AuthenticationResult && res.AuthenticationResult.AccessToken) {
          localStorage.setItem('email', res.email || 'google-user');
          localStorage.setItem('token', res.AuthenticationResult.AccessToken);
          sessionStorage.removeItem('googleAuthInProgress');
          this.showSnackBar('Google Login Successful', 'Close');
          console.log('Google login successful, redirecting to home...');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          console.error('Invalid response format:', res);
          this.showSnackBar('Invalid login response', 'Close');
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Google login failed:', err);
        sessionStorage.removeItem('googleAuthInProgress');
        this.showSnackBar(err.error?.message || 'Google Login Failed', 'Close');
        this.router.navigate(['/login']);
      }
    });
  }
}
