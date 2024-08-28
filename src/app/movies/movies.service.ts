import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Movie } from '../movies/movie.model';

const BACKEND_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movies: Movie[] = [];
  private moviesUpdated = new Subject<{
    movies: Movie[];
    movieCount: number;
  }>();
  private moviesRecommendedUpdated = new Subject<Movie[]>();

  constructor(private http: HttpClient, private router: Router) {}

  getMoviesRecommendedUpdatedListener() {
    return this.moviesRecommendedUpdated.asObservable();
  }

  getMoviesByListType(
    listType: string,
    moviesPerPage: number,
    currentPage: number
  ) {
    const queryParams = `?pagesize=${moviesPerPage}&page=${currentPage}`;
    this.http
      .get<{ message: string; movies: any[]; maxMovies: number }>(
        `${BACKEND_URL}/movies/list/${listType}` + queryParams
      )
      .pipe(
        map((responseData) => {
          return {
            movies: responseData.movies.map((movie) => {
              return {
                id: movie._id,
                title: movie.title,
                date: movie.date,
                dateSeen: movie.dateSeen,
                list: movie.list,
                creator: movie.creator,
                tmdbId: movie.tmdbId,
              };
            }),
            maxMovie: responseData.maxMovies,
          };
        })
      )
      .subscribe((mappedMoviesData) => {
        this.movies = mappedMoviesData.movies;
        this.moviesUpdated.next({
          movies: [...this.movies],
          movieCount: mappedMoviesData.maxMovie,
        });
        if (listType === 'recommended') {
          this.moviesRecommendedUpdated.next(mappedMoviesData.movies);
        }
      });
  }

  getRecommendedMoviesCount(): Observable<number> {
    const queryParams = `?pagesize=1&page=1`;
    return this.http
      .get<{ message: string; movies: any[]; maxMovies: number }>(
        `${BACKEND_URL}/movies/list/recommended${queryParams}`
      )
      .pipe(map((responseData) => responseData.maxMovies));
  }

  getMovieUpdateListener() {
    return this.moviesUpdated.asObservable();
  }

  getRandomMovie(): Observable<Movie> {
    return this.http
      .get<{ movie: Movie }>(`${BACKEND_URL}/movies/random/tosee`)
      .pipe(
        map((responseData) => responseData.movie),
        catchError((error) => {
          console.error(
            "Erreur lors de la récupération d'un film aléatoire :",
            error
          );
          return of(null); // Retourne un observable avec null en cas d'erreur
        })
      );
  }

  addMovie(movie: Movie): Observable<{ message: string; movie: Movie }> {
    return new Observable((observer) => {
      this.http
        .post<{ message: string; movie: Movie }>(
          `${BACKEND_URL}/add-movie`,
          movie
        )
        .subscribe({
          next: (responseData) => {
            observer.next(responseData);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  updateMovie(movie: Movie, list: string) {
    const updateData = { movie, list };

    return this.http.put(`${BACKEND_URL}/update-movie/${movie.id}`, updateData);
  }

  deleteMovie(movieId: string) {
    return this.http.delete(`${BACKEND_URL}/delete-movie/${movieId}`);
  }

  shareMovie(
    friendId: string,
    movieTitle: string,
    date: Date,
    tmdbId: string
  ): Observable<any> {
    return this.http
      .post<{ message: string }>(`${BACKEND_URL}/share-movie`, {
        friendId,
        movieTitle,
        date,
        tmdbId,
      })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du partage du film :', error);
          throw error;
        })
      );
  }
}
