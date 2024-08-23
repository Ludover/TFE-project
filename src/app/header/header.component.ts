import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FriendsService } from '../friends/friends.service';
import { MoviesService } from '../movies/movies.service';
// import { WebSocketService } from '../web-socket-service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userIsAuthenticated = false;
  userPseudo: string | null = null;
  friendRequestsCount: number = 0;
  recommendedMoviesCount: number = 0;
  private authListenerSubs: Subscription;
  private friendRequestsSubs: Subscription;
  private recommendedMoviesSub: Subscription;
  private friendRequestsUpdateSub: Subscription;
  private moviesUpdateSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private friendsService: FriendsService,
    private moviesService: MoviesService // private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.userIsAuthenticated = this.authService.getIsAuth();

    if (this.userIsAuthenticated) {
      this.loadUserPseudo();
      this.loadFriendRequestsCount();
      this.loadRecommendedMoviesCount();

      this.friendRequestsUpdateSub = this.friendsService
        .getFriendRequestsUpdatedListener()
        .subscribe(() => {
          this.loadFriendRequestsCount(); // Recharger le nombre de demandes d'amis
        });

      this.moviesUpdateSub = this.moviesService
        .getMoviesRecommendedUpdatedListener()
        .subscribe((movies) => {
          this.recommendedMoviesCount = movies.length; // Met à jour le compteur de films recommandés
        });

      const userId = this.authService.getUserId(); // Suppose que tu as une méthode pour récupérer l'userId
      // this.webSocketService.emitEvent('register', userId);

      // // Permet d'écouter les événements pour les demandes d'amis.
      // this.friendRequestsSubs = this.webSocketService
      //   .onEvent<any>('updateFriendRequests')
      //   .subscribe((friendRequest: any) => {
      //     this.friendRequestsCount += 1; // incrémenter le badge du nombre de demandes d'ami de 1.
      //   });

      // // Permet d'écouter les événements pour les films recommandés.
      // this.recommendedMoviesSub = this.webSocketService
      //   .onEvent<any>('updateMoviesList')
      //   .subscribe((movie: any) => {
      //     this.recommendedMoviesCount += 1; // Incrément le badge de films recommandés de 1.
      //   });
    }

    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        if (this.userIsAuthenticated) {
          this.loadUserPseudo();
          this.loadFriendRequestsCount();
          this.loadRecommendedMoviesCount();

          // Réenregistrer l'utilisateur auprès du WebSocket
          // const userId = this.authService.getUserId();
          // this.webSocketService.emitEvent('register', userId);
        } else {
          this.userPseudo = null;
          this.friendRequestsCount = 0;
          this.recommendedMoviesCount = 0;
        }
      });
  }

  loadUserPseudo() {
    this.authService.getUserPseudo().subscribe((response) => {
      this.userPseudo = response.pseudo;
    });
  }

  loadFriendRequestsCount() {
    this.friendRequestsSubs = this.friendsService
      .getFriendsRequestReceived()
      .subscribe((friendRequests) => {
        this.friendRequestsCount = friendRequests.length;
      });
  }

  loadRecommendedMoviesCount() {
    this.recommendedMoviesSub = this.moviesService
      .getRecommendedMoviesCount()
      .subscribe((count) => {
        this.recommendedMoviesCount = count;
      });
  }

  onLogout() {
    this.authService.logout();
    this.userPseudo = null;
    this.router.navigate(['/signin']);
  }

  ngOnDestroy(): void {
    if (this.authListenerSubs) {
      this.authListenerSubs.unsubscribe();
    }
    if (this.friendRequestsSubs) {
      this.friendRequestsSubs.unsubscribe();
    }
    if (this.recommendedMoviesSub) {
      this.recommendedMoviesSub.unsubscribe();
    }
    if (this.friendRequestsUpdateSub) {
      this.friendRequestsUpdateSub.unsubscribe();
    }
    if (this.moviesUpdateSub) {
      this.moviesUpdateSub.unsubscribe();
    }
  }
}
