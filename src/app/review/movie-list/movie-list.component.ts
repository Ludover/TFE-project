import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { AuthService } from 'src/app/Auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    public moviesService: MoviesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType('tosee');
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
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
      this.moviesService.deleteMovie(movieId);
      this.snackBar.open('Film supprimé avec succès', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
  }

  updateAsSeen(id: string, title: string, date: Date) {
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
      this.moviesService.updateMovie(id, title, date, 'saw');

      // Recharger les films après la mise à jour
      this.moviesService.getMoviesByListType('tosee');

      this.snackBar.open('Film marqué comme vu', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
    });
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
