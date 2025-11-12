import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../utils/envirnment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) { }

  sendContactMessage(data: { name: string; email: string; message: string }) {
    return this.http.post<any>(`${environment.apiUrl}/contact/send`, data);
  }
}
