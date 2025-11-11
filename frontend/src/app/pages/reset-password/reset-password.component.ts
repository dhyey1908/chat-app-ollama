import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    HttpClientModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  code: string = '';
  newPassword: string = '';
  email: string = '';
  resetForm: FormGroup;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.resetForm = this.fb.group({
      code: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.pattern(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
        )
      ]],
      confirmPassword: ['', [Validators.required]]
    });

    const storedEmail = localStorage.getItem('resetEmail');
    if (!storedEmail) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.email = storedEmail;
  }

  resetPassword() {
    const { code, password, confirmPassword } = this.resetForm.value;

    if (password !== confirmPassword) {
      this.showSnackBar("Passwords do not match", "Close");
      return;
    }

    console.log('code: ', code);
    console.log('password: ', password);
    if (!code || !password) {
      this.showSnackBar('Please enter code and new password', 'Close');
      return;
    }

    this.authService.confirmForgotPassword(this.email, code, password).subscribe({
      next: (res) => {
        if (!res.success) {
          const message = res.error || 'Failed to reset password';
          this.showSnackBar(message, 'Close');
          return;
        }

        localStorage.removeItem('resetEmail');
        this.showSnackBar('Password reset successful!', 'Close');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const message = err.error?.error || 'Failed to reset password';
        this.showSnackBar(message, 'Close');
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
}
