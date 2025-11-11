import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  email: string = '';
  forgotForm: FormGroup;
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private fb: FormBuilder

  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  sendResetCode() {
    if (this.forgotForm.invalid) {
      this.showSnackBar('Please enter a valid email', 'Close');
      return;
    }

    const email = this.forgotForm.get('email')?.value?.trim();
    console.log('Email: ', email);

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        if (!res.success) {
          const message = res.error || 'Failed to send OTP';
          this.showSnackBar(message, 'Close');
          return;
        }

        localStorage.setItem('resetEmail', email);
        this.showSnackBar('OTP sent to your email', 'Close');
        this.router.navigate(['/reset-password']);
      },
      error: (err) => {
        const message = err.error?.error || 'Failed to send OTP (Network/API Error)';
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
