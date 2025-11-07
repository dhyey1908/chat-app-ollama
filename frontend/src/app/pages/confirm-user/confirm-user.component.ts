import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-confirm-user',
  imports: [CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSnackBarModule],
  templateUrl: './confirm-user.component.html',
  styleUrl: './confirm-user.component.css'
})
export class ConfirmUserComponent {
  otpForm: FormGroup;
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });

    this.route.queryParams.subscribe(params => {
    this.email = params['email'];
  });
  }

  showSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  confirmOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const otp = this.otpForm.value.otp;

    const data: any = { email: this.email, code: otp }
    console.log('data: ', data);

    this.authService.confirmUserOtp(data).subscribe({
      next: (res) => {
        this.showSnackBar('OTP Verified Successfully', 'Close');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (err) => {
        console.error('OTP Failed:', err);
        this.showSnackBar('Invalid OTP', 'Close');
      }
    });
  }

}
