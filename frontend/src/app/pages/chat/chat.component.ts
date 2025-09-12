import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ChatService } from '../../services/chat.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  imports: [CommonModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MarkdownModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages: { from: string, text: string }[] = [];
  userInput: string = '';
  isLoading: boolean = false;

  constructor(private chatService: ChatService) { }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage = this.userInput;
    this.messages.push({ from: 'user', text: userMessage });
    this.userInput = '';
    this.isLoading = true;

    // show typing indicator
    this.messages.push({ from: 'bot', text: 'typing...' });

    this.chatService.sendMessage(userMessage).subscribe({
      next: (res) => {
        // remove typing indicator
        this.messages.pop();
        // push actual reply
        this.messages.push({ from: 'bot', text: res.response });
        this.isLoading = false;
      },
      error: () => {
        this.messages.pop();
        this.messages.push({ from: 'bot', text: '⚠️ Error: could not reach server.' });
        this.isLoading = false;
      }
    });
  }

}
