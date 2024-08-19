import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../Auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userIsAuthenticated = false;
  userPseudo: string | null = null;
  private authListenerSubs: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
      });
    if (this.userIsAuthenticated) {
      this.authService.getUserPseudo().subscribe((response) => {
        this.userPseudo = response.pseudo;
      });
    } else {
      this.userPseudo = null;
    }
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy(): void {}
}
