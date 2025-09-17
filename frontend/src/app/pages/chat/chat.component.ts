import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownModule } from 'ngx-markdown';
import { MatSelectModule } from '@angular/material/select';
import { ChatService } from '../../services/chat.service';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MarkdownModule,
    MatSelectModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  chats: Chat[] = [];
  activeChat!: Chat;
  userInput: string = '';
  isLoading: boolean = false;
  selectedModel: string = 'gemma3:270m';
  sidebarOpen: boolean = true;
  historyCleared = true;
  currentMessage = '';

  greetings = [
    'Hi there 👋 What’s on your mind today?',
    'Hello! How can I help you get started?',
    'Looking for something? Let’s explore together.',
    'Hey! Ready to dive in?',
    'What would you like to do first?',
    'Your journey starts here 🚀 What brings you today ?',
    'Hi 👋 Shall we begin ?',
    'How can I make your day easier ?',
    'Welcome back! What’s next ?',
    'Let’s start the conversation 💬'
  ];

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.chats = this.chatService.getChats();
    if (this.chats.length > 0) {
      this.activeChat = this.chats[0];
    } else {
      this.startNewChat();
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  startNewChat() {
    const chat = this.chatService.createChat('New Chat');
    this.chats = this.chatService.getChats();
    this.activeChat = chat;

    this.historyCleared = true;
    this.currentMessage = this.getRandomGreeting();
  }

  private getRandomGreeting(): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex];
  }

  selectChat(chat: Chat) {
    this.activeChat = chat;
    this.historyCleared = false;
  }

  removeChat(chat: Chat, event: Event) {
    event.stopPropagation(); // prevent selecting chat
    this.chatService.removeChat(chat.id);
    this.chats = this.chatService.getChats();

    // if active chat was removed, select another one
    if (this.activeChat?.id === chat.id) {
      if (this.chats.length > 0) {
        this.activeChat = this.chats[0];
        this.historyCleared = false;
      } else {
        this.startNewChat();
      }
    }
  }

  clearAllChats() {
    this.chatService.clearAllChats();
    this.chats = [];
    this.startNewChat();
  }


  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMessage: Message = { from: 'user', text: this.userInput };
    this.activeChat.messages.push(userMessage);

    // 🔹 If it's the first message, use it as the chat title
    if (this.activeChat.messages.length === 1) {
      this.activeChat.title = userMessage.text.length > 20
        ? userMessage.text.slice(0, 20) + '...'
        : userMessage.text;
    }

    this.chatService.updateChat(this.activeChat);

    this.userInput = '';
    this.isLoading = true;

    const botMessage: Message = { from: 'bot', text: '' };
    this.activeChat.messages.push(botMessage);
    this.chatService.updateChat(this.activeChat);

    this.chatService.sendMessage(this.activeChat, userMessage.text).subscribe({
      next: (chunk) => {
        botMessage.text += chunk;
        this.chatService.updateChat(this.activeChat);
      },
      error: () => {
        botMessage.text += '\n⚠️ Error: could not reach server.';
        this.isLoading = false;
        this.chatService.updateChat(this.activeChat);
      },
      complete: () => {
        this.isLoading = false;
        this.chatService.updateChat(this.activeChat);
      }
    });
    this.historyCleared = false;
  }
}
