import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { DateFormatService } from '../date-format.service';
import { AuthService } from 'src/app/Auth/auth.service';

@Component({
  selector: 'app-movie-list-done',
  templateUrl: './movie-list-done.component.html',
  styleUrls: ['./movie-list-done.component.css'],
})
export class MovieListDoneComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  private moviesSub?: Subscription;
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;

  constructor(
    public moviesService: MoviesService,
    public dateFormat: DateFormatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMovies();
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movies: Movie[]) => {
        this.isLoading = false;
        this.movies = movies.filter((movie) => movie.list === 'saw');
      });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  onDelete(movieId: string) {
    this.moviesService.deleteMovie(movieId);
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
