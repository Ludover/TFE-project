import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
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
        `http://localhost:3000/api/user/movies/list/recommended` + queryParams
      )
      .pipe(map((responseData) => responseData.maxMovies));
  }

  getMovieUpdateListener() {
    return this.moviesUpdated.asObservable();
  }

  getRandomMovie(): Observable<Movie> {
    return this.http
      .get<{ movie: Movie }>(
        'http://localhost:3000/api/user/movies/random/tosee'
      )
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
