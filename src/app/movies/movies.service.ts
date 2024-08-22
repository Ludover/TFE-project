import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { Movie } from '../movies/movie.model';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movies: Movie[] = [];
  private moviesUpdated = new Subject<{
    movies: Movie[];
    movieCount: number;
  }>();
  private moviesRecommendedUpdated = new Subject<Movie[]>();

  constructor(private http: HttpClient, private router: Router) {}

  getMoviesByListType(
    listType: string,
    moviesPerPage: number,
    currentPage: number
  ): Observable<{ movies: any[]; maxMovie: number }> {
    const queryParams = `?pagesize=${moviesPerPage}&page=${currentPage}`;
    return this.http
      .get<{ message: string; movies: any[]; maxMovies: number }>(
        `http://localhost:3000/api/user/movies/list/${listType}` + queryParams
      )
      .pipe(
        map((responseData) => {
          return {
            movies: responseData.movies.map((movie) => {
              return {
                id: movie._id,
                title: movie.title,
                date: movie.date,
                list: movie.list,
                creator: movie.creator,
                imdbId: movie.imdbId,
              };
            }),
            maxMovie: responseData.maxMovies,
          };
        })
      )
      // .subscribe((mappedMoviesData) => {
      //   this.movies = mappedMoviesData.movies;
      //   this.moviesUpdated.next({
      //     movies: [...this.movies],
      //     movieCount: mappedMoviesData.maxMovie,
      //   });
      // });
  }

  getRecommendedMoviesCount(): Observable<number> {
    return this.getMoviesByListType('recommended', 1, 1).pipe(
      map((responseData) => responseData.maxMovie)
    );
  }

  getMovieUpdateListener() {
    return this.moviesUpdated.asObservable();
  }

  addMovie(movie: Movie): Observable<{ message: string; movie: Movie }> {
    return new Observable((observer) => {
      this.http
        .post<{ message: string; movie: Movie }>(
          'http://localhost:3000/api/user/add-movie',
          movie
        )
        .subscribe({
          next: (responseData) => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  updateMovie(title: string, date: Date, list: string) {
    const updateData = { title, date, list };

    return this.http.put(
      `http://localhost:3000/api/user/update-movie/${title}`,
      updateData
    );
  }

  deleteMovie(movieId: string) {
    return this.http.delete(
      `http://localhost:3000/api/user/delete-movie/${movieId}`
    );
  }


  shareMovie(
    friendId: string,
    movieTitle: string,
    date: Date,
    imdbId: string
  ): Observable<any> {
    return this.http
      .post<{ message: string }>('http://localhost:3000/api/user/share-movie', {
        friendId,
        movieTitle,
        date,
        imdbId,
      })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du partage du film :', error);
          throw error;
        })
      );
  }
}
