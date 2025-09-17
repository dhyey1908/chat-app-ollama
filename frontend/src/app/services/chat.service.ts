import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5000/api/chat';

  // 🔹 Chat History Persistence
  private storageKey = 'chatHistory';

  getChats(): Chat[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveChats(chats: Chat[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(chats));
  }

  createChat(title: string = 'New Chat'): Chat {
    const chat: Chat = { id: Date.now().toString(), title, messages: [] };
    const chats = this.getChats();
    chats.push(chat);
    this.saveChats(chats);
    return chat;
  }
  
  updateChat(chat: Chat) {
    const chats = this.getChats().map(c => c.id === chat.id ? chat : c);
    this.saveChats(chats);
  }

  removeChat(chatId: string) {
    const chats = this.getChats().filter(c => c.id !== chatId);
    this.saveChats(chats);
  }

  clearAllChats() {
    localStorage.removeItem(this.storageKey);
  }


  sendMessage(chat: Chat, prompt: string, model:string): Observable<string> {
    return new Observable<string>(observer => {
      fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: chat.messages // 🔹 full history
        })
      }).then(async res => {
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
      }).catch(err => observer.error(err));
    });
  }
}
