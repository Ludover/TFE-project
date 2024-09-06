import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { TmdbService } from 'src/app/tmdb.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movies/movie-details-dialog/movie-details-dialog.component';
import { ShareMovieDialogComponent } from '../movies/share-movie-dialog/share-movie-dialog.component';
import { MoviesService } from '../movies/movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { NotifierService } from '../notifier.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  nowPlayingMovies: any[] = [];
  topRatedMovies: any[] = [];
  isLoading: boolean = true;
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;
  isScrollToTopVisible: boolean = false;

  totalNowPlayingMovies = 0;
  totalTopRatedMovies = 0;
  moviesPerPage = 20;
  currentNowPlayingPage = 1;
  currentTopRatedPage = 1;
  selectedTab = 'nowPlaying';

  constructor(
    private tmdbService: TmdbService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private moviesService: MoviesService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private notifierService: NotifierService
  ) {}

  ngOnInit(): void {
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });

    this.getNowPlayingMovies();
    this.getTopRatedMovies();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrollToTopVisible = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToId(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getNowPlayingMovies(page: number = this.currentNowPlayingPage) {
    this.tmdbService.getNowPlayingMovies(page).subscribe({
      next: (data) => {
        this.nowPlayingMovies = data.results;
        this.totalNowPlayingMovies = data.total_results;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getTopRatedMovies(page: number = this.currentTopRatedPage) {
    this.tmdbService.getTopRatedMovies(page).subscribe({
      next: (data) => {
        this.topRatedMovies = data.results;
        this.totalTopRatedMovies = data.total_results;
      },
    });
  }

  onNowPlayingPageChange(event: PageEvent) {
    console.log(event);
    this.currentNowPlayingPage = event.pageIndex + 1;
    this.getNowPlayingMovies(this.currentNowPlayingPage);
    this.scrollToId('now-playing-movies');
  }

  onTopRatedPageChange(event: PageEvent) {
    this.currentTopRatedPage = event.pageIndex + 1;
    this.getTopRatedMovies(this.currentTopRatedPage);
    this.scrollToId('top-rated-movies');
  }

  searchMovieById(id: string) {
    this.tmdbService.getMovieDetails(id).subscribe((response) => {
      if (response && response.Response !== 'False') {
        const isHandset = this.breakpointObserver.isMatched(
          Breakpoints.Handset
        );
        const dialogWidth = isHandset ? '90vw' : '1000px';

        this.dialog.open(MovieDetailsDialogComponent, {
          width: dialogWidth,
          maxWidth: '90vw',
          data: { movie: response },
        });
      } else {
        console.error('Aucun film trouvé avec cet ID.');
      }
    });
  }

  onSelectMovie(movie: any) {
    if (!this.UserIsAuthenticated) {
      this.notifierService.showNotification(
        'Vous devez être connecté pour ajouter un film à votre liste.',
        'Fermer',
        'info'
      );
      return;
    }

    this.moviesService.addMovie(movie).subscribe({
      next: () => {
        this.notifierService.showNotification(
          'Film ajouté avec succès',
          'Fermer',
          'success'
        );
      },
    });
  }

  onShare(movie: any) {
    if (!this.UserIsAuthenticated) {
      this.notifierService.showNotification(
        'Vous devez être connecté pour partager un film.',
        'Fermer',
        'info'
      );
      return;
    }

    const isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
    const dialogWidth = isHandset ? '90vw' : '600px';

    const dialogRef = this.dialog.open(ShareMovieDialogComponent, {
      width: dialogWidth,
      maxWidth: '90vw',
      data: {
        movie: {
          title: movie.title,
          date: new Date(),
          tmdbId: movie.id,
        },
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.moviesService
            .shareMovie(
              result.friendId,
              result.movieTitle,
              result.date,
              result.tmdbId,
              result.friendComment
            )
            .subscribe({});
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
    });
  }

  onTabChange(event: any) {
    this.selectedTab = event.value;
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
