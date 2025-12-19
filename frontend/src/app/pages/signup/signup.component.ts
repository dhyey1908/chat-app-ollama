import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
  imports: [CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatSnackBarModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  signupForm: FormGroup;
  passwordStrength: number = 0;

  constructor(private fb: FormBuilder, private authService: AuthService,
    private snackBar: MatSnackBar, private router: Router) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
        )
      ]],
      confirmPassword: ['', [Validators.required]]
    })
  }

  showSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: "right",
      verticalPosition: "top"
    });
  }

  checkPasswordStrength() {
    const password = this.signupForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    // Normalize to 1-4 scale
    if (strength <= 2) this.passwordStrength = 1;      // Weak
    else if (strength === 3) this.passwordStrength = 2; // Medium
    else if (strength === 4) this.passwordStrength = 3; // Strong
    else this.passwordStrength = 4;                     // Very Strong
  }

  getStrengthText(): string {
    switch (this.passwordStrength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Strong';
      case 4: return 'Very Strong';
      default: return '';
    }
  }

  getStrengthClass(): string {
    switch (this.passwordStrength) {
      case 1: return 'text-weak';
      case 2: return 'text-medium';
      case 3: return 'text-strong';
      case 4: return 'text-very-strong';
      default: return '';
    }
  }

  signup() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.signupForm.value;
    if (password !== confirmPassword) {
      this.showSnackBar("Passwords do not match", "Close");
      return;
    }

    const data = {
      email: this.signupForm.value.email,
      password: this.signupForm.value.password
    };

    const email = this.signupForm.value.email;

    this.authService.signupUser(data).subscribe({
      next: (res: any) => {
        if (!res.success) {
          const message = res.error || 'Failed to signup';
          this.showSnackBar(message, 'Close');
          return;
        }

        this.showSnackBar("Signup Successful", "Close");

        setTimeout(() => {
          this.router.navigate(['/confirm-user'], { queryParams: { email } });
        }, 1000);
      },
      error: (err) => {
        console.error('Signup Failed:', err);
        let errorMessage = 'Something went wrong!';

        if (err.error) {
          errorMessage = err.error.error;
        }

        this.showSnackBar(errorMessage, 'close');
      }
    })
  }
}
