import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { Movie } from './movie.model';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movies: Movie[] = [];
  private moviesUpdated = new Subject<Movie[]>();

  constructor(private http: HttpClient, private router: Router) {}

  getMovies() {
    this.http
      .get<{ message: string; movies: any }>('http://localhost:3000/api/movies')
      .pipe(
        map((movieData) => {
          return movieData.movies.map(
            (movie => {
              return {
                title: movie.title,
                date: movie.date,
                id: movie._id,
                creator: movie.creator
              };
            })
          );
        })
      )
      .subscribe((transformedmovies) => {
        this.movies = transformedmovies;
        this.moviesUpdated.next([...this.movies]);
      });
  }

  getMoviesByListType(listType: string) {
    this.http
      .get<Movie[]>(`http://localhost:3000/api/movies/list/${listType}`)
      .subscribe((movies) => {
        this.movies = movies;
        this.moviesUpdated.next([...this.movies]);
      });
  }

  getMovieUpdateListener() {
    return this.moviesUpdated.asObservable();
  }

  getMovie(id: string) {
    return this.http.get<{ _id: string; title: string; date: Date }>(
      'http://localhost:3000/api/movies/' + id
    );
  }

  addMovie(movie: Movie) {
    this.http
      .post<{ message: string; movieId: string }>(
        'http://localhost:3000/api/movies',
        movie
      )
      .subscribe((responseData) => {
        const id = responseData.movieId;
        movie.id = id;
        this.movies.push(movie);
        this.moviesUpdated.next([...this.movies]);
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, date: Date, list: string) {
    const movie: Movie = { id: id, title: title, date: date, list: list };
    this.http
      .put('http://localhost:3000/api/movies/' + id, movie)
      .subscribe((response) => {
        const updatedMovies = [...this.movies];
        const oldMovieIndex = updatedMovies.findIndex((m) => m.id === movie.id);
        updatedMovies[oldMovieIndex] = movie;
        this.movies = updatedMovies;
        this.moviesUpdated.next([...this.movies]);
        this.router.navigate(['/']);
      });
  }

  deleteMovie(movieId: string | null) {
    this.http
      .delete('http://localhost:3000/api/movies/' + movieId)
      .subscribe(() => {
        const updatedMovies = this.movies.filter(
          //Sert à actualiser la page automatiquement pour ne plus afficher les films supprimés.
          (movie) => movie.id !== movieId
        );
        this.movies = updatedMovies;
        this.moviesUpdated.next([...this.movies]);
      });
  }
}
