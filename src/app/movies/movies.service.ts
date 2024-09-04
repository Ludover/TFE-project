import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { Movie } from '../movies/movie.model';
import { SSEService } from '../sse.service';

const BACKEND_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movies: Movie[] = [];
  private moviesUpdated = new Subject<{
    movies: Movie[];
    movieCount: number;
  }>();
  private moviesRecommendedUpdated = new Subject<void>();

  constructor(private http: HttpClient, private sseService: SSEService) {
    this.observeMovieRecommendations();
  }

  // Vérifie si de nouvelles recommendations de films arrivent via le SS.
  // Quand un nouveau film est recommandé, elle déclenche une mise à jour.
  private observeMovieRecommendations() {
    this.sseService.receiveMovieRecommended().subscribe(() => {
      this.moviesRecommendedUpdated.next(); // Déclencher la mise à jour quand un événement est reçu
    });
  }

  // Retourne un observable qui informe quand la liste des films est mise à jour.
  // Utilisé pour informer d'autres parties de l'application que la liste des films a changé.
  getMovieUpdateListener() {
    return this.moviesUpdated.asObservable();
  }

  // Retourne un observable qui informe quand un nouveau film est recommandé.
  // Utilisé pour informer d'autres parties de l'application d'une nouvelle recommandation.
  getMoviesRecommendedUpdatedListener() {
    return this.moviesRecommendedUpdated.asObservable();
  }

  // Méthode pour la récupération d'une liste de films selon le type de liste (tosee, seen ou recommended), le nombre de films par page, et la page actuelle.
  // Une fois les données récupérées, met à jour la liste des films et informe les autres parties de l'application.
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
          this.moviesRecommendedUpdated.next();
        }
      });
  }

  // Méthode permettant de récupérer le nombre total de films recommandés depuis le backend.
  getRecommendedMoviesCount(): Observable<number> {
    const queryParams = `?pagesize=1&page=1`;
    return this.http
      .get<{ message: string; movies: any[]; maxMovies: number }>(
        `${BACKEND_URL}/movies/list/recommended${queryParams}`
      )
      .pipe(map((responseData) => responseData.maxMovies));
  }

  // Méthode pour récupèrer un film au hasard depuis la liste des films "à voir" depuis le backend.
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

  // Méthode permettant d'ajouter un nouveau film à la base de données.
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

  // Méthode pour changer la liste du film de tosee à seen ou de recommended à tosee.
  updateMovie(movie: Movie, list: string) {
    const updateData = { movie, list };

    return this.http.put(`${BACKEND_URL}/update-movie/${movie.id}`, updateData);
  }

  // Méthode pour supprimer un film de la base de données.
  deleteMovie(movieId: string) {
    return this.http.delete(`${BACKEND_URL}/delete-movie/${movieId}`);
  }

  // Méthode pour partager un film avec un ami.
  shareMovie(
    friendId: string,
    movieTitle: string,
    date: Date,
    tmdbId: string,
    friendComment: string
  ): Observable<any> {
    return this.http
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
          throw error;
        })
      );
  }
}
