import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FriendsService } from '../friends/friends.service';
import { MoviesService } from '../movies/movies.service';
import { SSEService } from '../sse.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpened: boolean = false;
  userIsAuthenticated = false;
  userPseudo: string | null = null;
  friendRequestsCount: number = 0;
  recommendedMoviesCount: number = 0;
  totalCount: number = 0;

  // Ces variables servent à "se désabonner" lorsque le composant est détruit, pour éviter des problèmes de mémoire.
  private authListenerSubs: Subscription;
  private friendRequestsSubs: Subscription;
  private recommendedMoviesSub: Subscription;
  private friendRequestsUpdateSub: Subscription;
  private moviesUpdateSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private friendsService: FriendsService,
    private moviesService: MoviesService,
    private sseService: SSEService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Abonnement aux changements d'état d'authentification.
    this.authListenerSubs = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
        this.updateUserState();
      });

    // Vérification initiale de l'état d'authentification.
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.updateUserState();
  }

  private updateUserState(): void {
    if (this.userIsAuthenticated) {
      this.loadUserPseudo();
      this.loadFriendRequestsCount();
      this.loadRecommendedMoviesCount();
      this.sseService.connect(localStorage.getItem('userId'));

      if (!this.friendRequestsUpdateSub) {
        this.friendRequestsUpdateSub = this.friendsService
          .getFriendRequestsUpdatedListener()
          .subscribe(() => {
            this.loadFriendRequestsCount();
          });
      }

      if (!this.moviesUpdateSub) {
        this.moviesUpdateSub = this.moviesService
          .getMoviesRecommendedUpdatedListener()
          .subscribe(() => {
            this.loadRecommendedMoviesCount();
          });
      }
    } else {
      this.userPseudo = null;
      this.friendRequestsCount = 0;
      this.recommendedMoviesCount = 0;
      this.totalCount = 0;
      this.sseService.disconnect();
    }
  }

  // Méthode permettant de récupérer le pseudo de l'utilisateur.
  loadUserPseudo() {
    this.authService.getUserPseudo().subscribe((response) => {
      this.userPseudo = response.pseudo;
    });
  }

  // Méthode pour récupérer le nombre de demandes d'amis en attente pour alimenter les badges.
  loadFriendRequestsCount() {
    this.friendRequestsSubs = this.friendsService
      .getFriendsRequestReceived()
      .subscribe((friendRequests) => {
        this.friendRequestsCount = friendRequests.length;
        this.totalCount =
          this.recommendedMoviesCount + this.friendRequestsCount;
      });
  }

  // Méthode pour récupérer le nombre de films recommandés pour alimenter les badges.
  loadRecommendedMoviesCount() {
    this.recommendedMoviesSub = this.moviesService
      .getRecommendedMoviesCount()
      .subscribe((count) => {
        this.recommendedMoviesCount = count;
        this.totalCount =
          this.recommendedMoviesCount + this.friendRequestsCount;
      });
  }

  // Méthode pour ouvrir ou fermer le menu.
  toggleMenu() {
    this.menuOpened = !this.menuOpened;
  }

  // Méthode pour fermer le menu.
  closeMenu() {
    this.menuOpened = false;
  }

  // Méthode pour déconnecter l'utilisateur et le rediriger vers la page d'accueil.
  onLogout() {
    this.authService.logout();
    this.userPseudo = null;
    this.router.navigate(['/']);
  }

  // Méthode lorsque le composant est détruit afin de se désabonner de tous les abonnements pour éviter les fuites de mémoire.
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
    this.sseService.disconnect();
  }
}
