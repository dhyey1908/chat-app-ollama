import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, MatToolbarModule, MatButtonModule,
    CommonModule, MatIcon, MatMenuModule,],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  userEmail: string | null = null;

  constructor(private router: Router) { }
  ngOnInit() {
    this.userEmail = localStorage.getItem('email');
  }

  logout() {
    localStorage.removeItem('email');
    this.userEmail = null;
    this.router.navigate(['/login']);
  }
}
