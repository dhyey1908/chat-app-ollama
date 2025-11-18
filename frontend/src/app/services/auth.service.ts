import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../utils/envirnment';

interface userData {
  email: string;
  password: string;
}

interface otp {
  email: string;
  code: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  getUserId(email: string) {
    return this.http.get<{ userId: string }>(`${environment.apiUrl}/userId?email=${email}`);
  }

  signupUser(data: userData) {
    return this.http.post<userData>(`${environment.apiUrl}/signup`, data);
  }

  confirmUserOtp(data: otp) {
    return this.http.post<otp>(`${environment.apiUrl}/confirmUser`, data);
  }

  loginUser(data: userData) {
    return this.http.post<userData>(`${environment.apiUrl}/login`, data, { withCredentials: true });
  }

  redirectToGoogle() {
    const url =
      `https://${environment.cognitoDomain}/oauth2/authorize` +
      `?identity_provider=Google` +
      `&response_type=code` +
      `&client_id=${environment.cognitoClientId}` +
      `&redirect_uri=${encodeURIComponent(environment.UiUrl + '/login')}` +
      `&scope=${(environment.scope)}`;

    window.location.href = url;
  }

  handleGoogleCallback(code: string) {
    return this.http.post<any>(`${environment.apiUrl}/google/token`, { code }, { withCredentials: true });
  }

  logout() {
    this.http.post<any>(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.removeItem('email');
        localStorage.removeItem('userId');

        const logoutUrl =
          `https://${environment.cognitoDomain}/logout` +
          `?client_id=${environment.cognitoClientId}` +
          `&logout_uri=${environment.UiUrl}/login`;

        window.location.href = logoutUrl;
      },
      error: (err) => {
        console.error('Backend logout failed, proceeding to redirect', err);
        // Proceed anyway to clear client state and redirect
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        const logoutUrl =
          `https://${environment.cognitoDomain}/logout` +
          `?client_id=${environment.cognitoClientId}` +
          `&logout_uri=${environment.UiUrl}/login`;
        window.location.href = logoutUrl;
      }
    });
  }

  forgotPassword(email: string) {
    return this.http.post<any>(`${environment.apiUrl}/forgot-password`, { email });
  }

  confirmForgotPassword(email: string, code: string, newPassword: string) {
    return this.http.post<any>(`${environment.apiUrl}/confirm-forgot-password`, {
      email,
      code,
      newPassword
    });
  }
}
