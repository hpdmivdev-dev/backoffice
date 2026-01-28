import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  constructor(private authService: AuthService) {}

  get userEmail(): string | null {
    return this.authService.user()?.email ?? null;
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
