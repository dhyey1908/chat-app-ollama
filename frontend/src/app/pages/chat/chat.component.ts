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
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Chat, Message } from '../../services/chat.service';
import { NavbarComponent } from '../../core/navbar/navbar.component';

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
    MatSelectModule,
    MatMenuModule,
    NavbarComponent
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
  historyCleared = false;
  currentMessage = '';
  private botSubscription?: Subscription;
  userEmail: string = '';
  lastUserMessage: string | null = null;

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

  constructor(private chatService: ChatService, private dialog: MatDialog, private router: Router) {
  }

  ngOnInit() {
    this.userEmail = localStorage.getItem('email') || 'User';

    this.chatService.getAllSessions().subscribe({
      next: (sessions) => {
        this.chats = sessions;
        if (this.chats.length > 0) {
          this.selectChat(this.chats[0]);
        } else {
          this.startNewChat();
        }
      },
      error: (err) => console.error('Failed to load chats:', err)
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  startNewChat() {
    const existingEmptyChat = this.chats.find(chat => chat.messages && chat.messages.length === 0);

    if (existingEmptyChat) {
      this.activeChat = existingEmptyChat;
      this.historyCleared = true;
      this.currentMessage = this.getRandomGreeting();
    } else {
      this.chatService.createChat('New Chat').subscribe({
        next: (res) => {
          this.chatService.getAllSessions().subscribe((sessions) => {
            this.chats = sessions;
            this.activeChat = sessions[0];
            this.historyCleared = true;
            this.currentMessage = this.getRandomGreeting();
          });
        },
        error: (err) => console.error('Failed to create chat:', err)
      });
    }
  }

  private getRandomGreeting(): string {
    const randomIndex = Math.floor(Math.random() * this.greetings.length);
    return this.greetings[randomIndex];
  }

  selectChat(chat: Chat) {
    this.activeChat = chat;
    this.chatService.getSessionMessages(chat.id).subscribe({
      next: (messages) => {
        this.activeChat.messages = messages;
        if (messages.length === 0) {
          this.historyCleared = true;
          this.currentMessage = this.getRandomGreeting();
        } else {
          this.historyCleared = false;
        }
      },
      error: (err) => console.error('Failed to load messages:', err)
    });
  }

  removeChat(chat: Chat, event: Event) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Chat',
        message: 'Are you sure you want to delete this chat?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.chatService.deleteChat(chat.id).subscribe({
          next: () => {
            this.chatService.getAllSessions().subscribe(sessions => {
              this.chats = sessions;
              if (this.chats.length > 0) {
                this.activeChat = this.chats[0];
                this.historyCleared = false;
                this.startNewChat();
              } else {
                this.startNewChat();
              }
            });
          },
          error: (err) => console.error('Failed to delete chat:', err)
        });
      }
    });
  }

  clearAllChats() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Clear All Chats', message: 'This will delete all chats permanently. Continue?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.chatService.clearAllChats().subscribe({
          next: () => {
            this.chats = [];
            this.startNewChat();
          },
          error: (err) => console.error('Failed to clear chats:', err)
        });
      }
    });
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;
    if (!this.activeChat) return;
    const userMessage: Message = { from: 'user', text: this.userInput };
    this.activeChat.messages = this.activeChat.messages || [];
    this.activeChat.messages.push(userMessage);

    this.lastUserMessage = this.userInput;

    if (this.activeChat.messages.length === 1) {
      this.activeChat.title = userMessage.text.length > 20 ? userMessage.text.slice(0, 20) + '...' : userMessage.text;
      this.chatService.updateChatTitle(this.activeChat.id, this.activeChat.title).subscribe();
    }

    // Save user message to DB
    this.chatService.saveMessage(this.activeChat.id, 'user', userMessage.text).subscribe();

    this.userInput = '';
    this.isLoading = true;

    const botMessage: Message = { from: 'bot', text: '' };
    this.activeChat.messages.push(botMessage);

    this.botSubscription = this.chatService.sendMessage(this.activeChat, userMessage.text, this.selectedModel).subscribe({
      next: (chunk) => (botMessage.text += chunk),
      error: () => {
        botMessage.text += '\n⚠️ Error: could not reach server.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
        this.chatService.saveMessage(this.activeChat.id, 'bot', botMessage.text).subscribe();
      }
    });

    this.historyCleared = false;
  }

  stopResponse() {
    if (this.botSubscription) {
      this.botSubscription.unsubscribe();
      this.botSubscription = undefined;
      this.isLoading = false;
    }
  }

  tryAgain() {
    if (!this.lastUserMessage || this.isLoading || !this.activeChat?.messages) return; // ✅ safe check

    const lastBotIndex = this.activeChat.messages.map(m => m.from).lastIndexOf('bot');
    if (lastBotIndex !== -1) {
      this.activeChat.messages.splice(lastBotIndex, 1);
    }

    const botMessage: Message = { from: 'bot', text: '' };
    this.activeChat.messages.push(botMessage);

    this.isLoading = true;
    this.botSubscription = this.chatService.sendMessage(this.activeChat, this.lastUserMessage, this.selectedModel).subscribe({
      next: (chunk) => (botMessage.text += chunk),
      error: () => {
        botMessage.text += '\n⚠️ Error: could not reach server.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
        this.chatService.saveMessage(this.activeChat.id, 'bot', botMessage.text).subscribe();
      }
    });
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
