import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, MatToolbarModule, MatButtonModule,
    CommonModule, MatIcon, MatMenuModule,],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Input() showSidebarToggle = false;
  @Input() sidebarOpen = false;
  @Output() sidebarToggle = new EventEmitter<void>();

  userEmail: string | null = null;

  constructor(private router: Router, private authService: AuthService) { }
  ngOnInit() {
    this.userEmail = localStorage.getItem('email');
  }

  onToggleSidebar() {
    this.sidebarToggle.emit();
  }

  logout() {
    this.authService.logout();
  }
}
