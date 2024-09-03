import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { SocketService } from './web-socket-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private authListenerSubs: Subscription;

  constructor(
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.authService.autoAuthUser();
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.socketService.connect();
        } else {
          this.socketService.disconnect();
        }
      });
  }

  ngOnDestroy() {
    this.authListenerSubs.unsubscribe();
  }
}
