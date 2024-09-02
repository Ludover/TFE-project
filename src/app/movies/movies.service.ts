import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SocketService } from '../web-socket-service';

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

  constructor(private http: HttpClient, private socketService: SocketService) {
    this.observeSocket();
  }

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
                friendComment: movie.friendComment,
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

  deleteMovie(movieId: string, list: string) {
    if (list === 'recommended') {
      return new Observable((observer) => {
        this.http
          .delete(`${BACKEND_URL}/delete-movie/${movieId}`, {})
          .subscribe({
            next: (response) => {
              // Mettre à jour la liste locale des films recommandés
              this.movies = this.movies.filter((movie) => movie.id !== movieId);

              // Émettre la liste mise à jour des films recommandés
              this.moviesRecommendedUpdated.next([...this.movies]);

              observer.next(response);
            },
            error: (err) => {
              observer.error(err);
            },
            complete: () => {
              observer.complete();
            },
          });
      });
    } else {
      return this.http.delete(`${BACKEND_URL}/delete-movie/${movieId}`);
    }
  }

  shareMovie(
    friendId: string,
    movieTitle: string,
    date: Date,
    tmdbId: string,
    friendComment: string
  ): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post<{ message: string }>(`${BACKEND_URL}/share-movie`, {
          friendId,
          movieTitle,
          date,
          tmdbId,
          friendComment,
        })
        .pipe(
          catchError((error) => {
            console.error('Erreur lors du partage du film :', error);
            observer.error(error);
            return of(null); // Retourne un observable avec null en cas d'erreur
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              this.socketService.emitMovieRecommended({
                targetUserId: friendId,
              }); // Émettre l'événement après la réussite de la requête
              observer.next(response);
            }
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  // Méthode pour écouter les événements WebSocket
  private observeSocket() {
    this.socketService.receiveMovieRecommended().subscribe((movie: any) => {
      this.movies.push(movie);
      this.moviesRecommendedUpdated.next([...this.movies]);
    });
  }
}
