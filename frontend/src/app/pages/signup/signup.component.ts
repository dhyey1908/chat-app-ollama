import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
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
