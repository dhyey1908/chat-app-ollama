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
}
