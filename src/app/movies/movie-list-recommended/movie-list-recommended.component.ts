import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { OmdbService } from 'src/app/omdb.service';

@Component({
  selector: 'app-movie-list-recommended',
  templateUrl: './movie-list-recommended.component.html',
  styleUrls: ['./movie-list-recommended.component.css'],
})
export class MovieListRecommendedComponent implements OnInit, OnDestroy {
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
    private dialog: MatDialog,
    private omdbService: OmdbService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType(
      'recommended',
      this.moviesPerPage,
      this.currentPage
    );
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movieData: { movies: Movie[]; movieCount: number }) => {
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
    this.moviesService.getMoviesByListType(
      'recommended',
      this.moviesPerPage,
      this.currentPage
    );
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
        this.moviesService.getMoviesByListType(
          'tosee',
          this.moviesPerPage,
          this.currentPage
        );
      });
      this.snackBar.open('Film supprimé avec succès', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
    // this.moviesService.getMoviesRecommended();
    // this.moviesSub = this.moviesService
    //   .getMoviesRecommendedUpdateListener()
    //   .subscribe((movies: Movie[]) => {
    //     this.isLoading = false;
    //     this.movies = movies;
    //   });
  }

  updateAsToSee(movie: Movie) {
    const snackBarRef = this.snackBar.open(
      `Êtes-vous sûr de vouloir mettre ${movie.title} dans la liste à voir ?`,
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );
    snackBarRef.onAction().subscribe(() => {
      this.moviesService
        .updateMovie(movie.title, movie.date, 'tosee')
        .subscribe({
          next: () => {
            // Rafraîchir la liste des films après la mise à jour réussie
            this.moviesService.getMoviesByListType(
              'tosee',
              this.moviesPerPage,
              this.currentPage
            );
            this.snackBar.open('Film marqué comme vu', 'Fermer', {
              duration: 3000,
              verticalPosition: 'top',
            });
          },
          error: (error) => {
            if (
              error.status === 400 &&
              error.error.message ===
                'Ce film est déjà dans votre liste à voir.'
            ) {
              this.snackBar.open(
                'Ce film est déjà dans votre liste à voir.',
                'Fermer',
                {
                  duration: 3000,
                  verticalPosition: 'top',
                  panelClass: ['mat-toolbar', 'mat-warn'],
                }
              );
            } else {
              this.snackBar.open(
                'Erreur lors de la mise à jour du film',
                'Fermer',
                {
                  duration: 3000,
                  verticalPosition: 'top',
                  panelClass: ['mat-toolbar', 'mat-warn'],
                }
              );
            }
          },
        });
    });
  }

  searchMovieById(id: string) {
    this.omdbService.searchMovieById(id).subscribe((response) => {
      if (response && response.Response !== 'False') {
        this.dialog.open(MovieDetailsDialogComponent, {
          width: '600px',
          data: { movie: response },
        });
      } else {
        console.error('Aucun film trouvé avec cet ID.');
      }
    });
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
