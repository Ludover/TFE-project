import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
})
export class MovieListComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  private moviesSub?: Subscription;
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;
  totalMovies = 0;
  moviesPerPage = 10;
  currentPage = 1;
  pageSizeOptions = [5, 10, 20];

  constructor(
    public moviesService: MoviesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType('tosee', this.moviesPerPage, this.currentPage);
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movieData: {movies: Movie[], movieCount: number}) => {
        this.isLoading = false;
        this.totalMovies = movieData.movieCount;
        this.movies = movieData.movies;
      });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.moviesPerPage = pageData.pageSize;
    this.moviesService.getMoviesByListType('tosee', this.moviesPerPage, this.currentPage);
  }

  onDelete(movieId: string) {
    const snackBarRef = this.snackBar.open(
      'Êtes-vous sûr de vouloir supprimer ce film ?',
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.moviesService.deleteMovie(movieId).subscribe(() => {
        this.moviesService.getMoviesByListType("tosee", this.moviesPerPage,this.currentPage )
      });
      this.snackBar.open('Film supprimé avec succès', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
  }

  updateAsSeen(title: string, date: Date) {
    const snackBarRef = this.snackBar.open(
      `Êtes-vous sûr de vouloir marquer "${title}" comme vu ?`,
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['mat-toolbar', 'mat-primary'],
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // Appeler le service pour mettre à jour le film
      this.moviesService.updateMovie(title, date, 'seen');

      // Recharger les films après la mise à jour
      this.moviesService.getMoviesByListType('tosee', this.moviesPerPage, this.currentPage);

      this.snackBar.open('Film marqué comme vu', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
  }

  onShare(movie: Movie) {
    const dialogRef = this.dialog.open(ShareMovieDialogComponent, {
      width: '250px',
      data: { movie: movie },
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.moviesService
            .shareMovie(result.friendId, result.movieTitle, result.date)
            .subscribe({
              next: () => {
                this.snackBar.open('Film partagé avec succès', 'Fermer', {
                  duration: 3000,
                  verticalPosition: 'top',
                });
              },
              error: (error) => {
                // Vérifier si le message d'erreur est celui attendu
                const errorMessage =
                  error.error.message || 'Erreur lors du partage du film';
                if (
                  errorMessage === 'Ce film a déjà été conseillé à cet ami.'
                ) {
                  this.snackBar.open(errorMessage, 'Fermer', {
                    duration: 3000,
                    verticalPosition: 'top',
                  });
                } else {
                  this.snackBar.open('Une erreur est survenue', 'Fermer', {
                    duration: 3000,
                    verticalPosition: 'top',
                  });
                }
              },
            });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
    });
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
