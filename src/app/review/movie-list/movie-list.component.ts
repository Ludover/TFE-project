import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { DateFormatService } from '../date-format.service';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
})
export class MovieListComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  private moviesSub?: Subscription;

  constructor(
    public moviesService: MoviesService,
    public dateFormat: DateFormatService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMovies();
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movies: Movie[]) => {
        this.isLoading = false;
        this.movies = movies;
      });
  }

  onDelete(movieId: string) {
    this.moviesService.deleteMovie(movieId);
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
  }
}
