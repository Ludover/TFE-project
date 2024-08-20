import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { AuthService } from 'src/app/Auth/auth.service';
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

  constructor(
    public moviesService: MoviesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesRecommended();
    this.moviesSub = this.moviesService
      .getMoviesRecommendedUpdateListener()
      .subscribe((movies: Movie[]) => {
        this.isLoading = false;
        this.movies = movies;
      });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  onDelete(movieTitle: string) {
    const snackBarRef = this.snackBar.open(
      'Êtes-vous sûr de vouloir supprimer ce film ?',
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.moviesService.deleteMovieRecommended(movieTitle);
      this.snackBar.open('Film supprimé avec succès', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
    this.moviesService.getMoviesRecommended();
    this.moviesSub = this.moviesService
      .getMoviesRecommendedUpdateListener()
      .subscribe((movies: Movie[]) => {
        this.isLoading = false;
        this.movies = movies;
      });
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
