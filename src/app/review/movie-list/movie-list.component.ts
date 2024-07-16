import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { DateFormatService } from '../date-format.service';
import { AuthService } from 'src/app/Auth/auth.service';

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
    public dateFormat: DateFormatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType('tosee');
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movies: Movie[]) => {
        this.isLoading = false;
        console.log('Received movies: ', movies); // Vérifiez les données ici
        this.movies.push(...movies.filter((movie) => movie.list === 'tosee')); // Assurez-vous que c'est bien un tableau
        console.log(this.movies); // Vérifiez les données filtrées
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
