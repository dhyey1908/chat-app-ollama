import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
  
  signupUser(data: userData) {
    return this.http.post<userData>(`${environment.apiUrl}/signup`, data);
  }

  confirmUserOtp(data: otp) {
    console.log('data: ', data);
    return this.http.post<otp>(`${environment.apiUrl}/confirmUser`, data);
  }

  loginUser(data: userData) {
    return this.http.post<userData>(`${environment.apiUrl}/login`, data);
  }

  redirectToGoogle() {
    const url =
      `https://${environment.cognitoDomain}/oauth2/authorize` +
      `?identity_provider=Google` +
      `&response_type=code` +
      `&client_id=${environment.cognitoClientId}` +
      `&redirect_uri=${encodeURIComponent(environment.UiUrl + '/login')}` +
      `&scope=${(environment.scope)}`;

    console.log('Redirecting to:', url);
    window.location.href = url;
  }

  handleGoogleCallback(code: string) {
    return this.http.post<any>(`${environment.apiUrl}/google/token`, { code });
  }

  logout() {
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    sessionStorage.clear();

    const logoutUrl =
      `https://${environment.cognitoDomain}/logout` +
      `?client_id=${environment.cognitoClientId}` +
      `&logout_uri=${environment.UiUrl}/login`;

    window.location.href = logoutUrl;
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
