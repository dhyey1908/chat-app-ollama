import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  /**
   * Reusable HTTP options that send cookies with every request.
   */
  private getHttpOptions() {
    return { withCredentials: true };
  }

  getAllSessions(): Observable<Chat[]> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.get<Chat[]>(`${this.apiUrl}/chat/sessions?userId=${userId}`, this.getHttpOptions());
  }

  createChat(title: string = 'New Chat'): Observable<any> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.post(`${this.apiUrl}/chat/sync-chats`, { userId, title }, this.getHttpOptions());
  }

  getSessionMessages(sessionId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/messages?sessionId=${sessionId}`, this.getHttpOptions());
  }

  saveMessage(sessionId: string, from: 'user' | 'bot', text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/messages`, { sessionId, sender: from, text }, this.getHttpOptions());
  }

  deleteChat(sessionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/session/${sessionId}`, this.getHttpOptions());
  }

  clearAllChats(): Observable<any> {
    const userId = localStorage.getItem(this.userIdKey);
    return this.http.delete(`${this.apiUrl}/chat/clear/${userId}`, this.getHttpOptions());
  }

  sendMessage(chat: Chat, prompt: string, model: string): Observable<string> {
    return new Observable<string>(observer => {
      fetch(`${this.apiUrl}/chat/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
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
