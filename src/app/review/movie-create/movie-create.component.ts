import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';

@Component({
  selector: 'app-movie-create',
  templateUrl: './movie-create.component.html',
  styleUrls: ['./movie-create.component.css'],
})
export class MovieCreateComponent implements OnInit {
  private mode = 'create';
  private movieId: string;
  movie: Movie;
  isLoading = false;

  constructor(
    public moviesService: MoviesService,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('movieId')) {
        this.mode = 'edit';
        this.movieId = paramMap.get('movieId');
        this.isLoading = true;
        this.moviesService.getMovie(this.movieId).subscribe((movieData) => {
          this.isLoading = false;
          this.movie = {
            id: movieData._id,
            title: movieData.title,
            date: movieData.date,
            list: 'tosee',
          };
        });
      } else {
        this.mode = 'create';
        this.movieId = null;
      }
    });
  }

  onSaveMovie(form: NgForm) {
    if (form.invalid) return;
    const movie: Movie = {
      id: '',
      title: form.value.title,
      date: new Date(),
      list: 'tosee',
    };
    this.isLoading = true;
    if (this.mode === 'create') {
      this.moviesService.addMovie(movie);
    } else {
      this.moviesService.updatePost(
        this.movieId,
        movie.title,
        movie.date,
        movie.list
      );
    }

    form.resetForm();
  }
}
