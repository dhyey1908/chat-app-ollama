import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../utils/envirnment';

export interface Message {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages?: Message[];
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;
  private userIdKey = 'userId';

  constructor(private http: HttpClient) { }

  private getAuthHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getAllSessions(): Observable<Chat[]> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.get<Chat[]>(`${this.apiUrl}/chat/sessions?userId=${userId}`, this.getAuthHttpOptions());
  }

  createChat(title: string = 'New Chat'): Observable<any> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.post(`${this.apiUrl}/chat/sync-chats`, { userId, title }, this.getAuthHttpOptions());
  }

  getSessionMessages(sessionId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/messages?sessionId=${sessionId}`, this.getAuthHttpOptions());
  }

  saveMessage(sessionId: string, from: 'user' | 'bot', text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/messages`, { sessionId, sender: from, text }, this.getAuthHttpOptions());
  }

  deleteChat(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/session/${sessionId}`, this.getAuthHttpOptions());
  }

  clearAllChats(): Observable<any> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.delete(`${this.apiUrl}/chat/clear/${userId}`, this.getAuthHttpOptions());
  }

  sendMessage(chat: Chat, prompt: string, model: string): Observable<string> {
    const token = localStorage.getItem('token');
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    return new Observable<string>(observer => {
      fetch(`${this.apiUrl}/chat/model`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: model,
          messages: chat.messages
        })
      })
        .then(async res => {
          if (!res.body) throw new Error('No response body');
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(l => l.trim() !== '');
              for (const line of lines) {
                try {
                  const obj = JSON.parse(line);
                  if (obj.content) observer.next(obj.content);
                } catch {
                  console.error('Failed to parse chunk:', line);
                }
              }
            }
          }
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }
}
