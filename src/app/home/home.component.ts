import { Component, OnDestroy, OnInit } from '@angular/core';
import { TmdbService } from 'src/app/tmdb.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movies/movie-details-dialog/movie-details-dialog.component';
import { ShareMovieDialogComponent } from '../movies/share-movie-dialog/share-movie-dialog.component';
import { MoviesService } from '../movies/movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  nowPlayingMovies: any[] = [];
  upcomingMovies: any[] = [];
  isLoading: boolean = true;
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;

  constructor(
    private tmdbService: TmdbService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private moviesService: MoviesService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });

    this.getNowPlayingMovies();
    this.getUpcomingMovies();
  }

  getNowPlayingMovies() {
    this.tmdbService.getNowPlayingMovies().subscribe({
      next: (data) => {
        this.nowPlayingMovies = data.results;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getUpcomingMovies() {
    this.tmdbService.getUpcomingMovies().subscribe({
      next: (data) => {
        this.upcomingMovies = data.results;
      },
    });
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
      this.snackBar.open(
        'Vous devez être connecté pour ajouter un film à votre liste.',
        'Fermer',
        {
          duration: 3000,
          verticalPosition: 'top',
        }
      );
      return;
    }

    this.moviesService.addMovie(movie).subscribe({
      next: () => {
        this.snackBar.open('Film ajouté avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
    });
  }

  onShare(movie: any) {
    if (!this.UserIsAuthenticated) {
      this.snackBar.open(
        'Vous devez être connecté pour partager un film.',
        'Fermer',
        {
          duration: 3000,
          verticalPosition: 'top',
        }
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

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
