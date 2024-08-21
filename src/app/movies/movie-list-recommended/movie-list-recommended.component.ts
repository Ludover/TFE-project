import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType('recommended', this.moviesPerPage, this.currentPage);
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
    snackBarRef.onAction().subscribe((result) => {
      this.moviesService.moveMovieToNormalList(movie.title).subscribe({
        next: (response) => {
          this.snackBar.open('Film déplacé vers la liste normale', 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du déplacement du film', 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
          });
        },
      });
    });
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
