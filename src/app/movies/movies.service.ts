import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { Movie } from '../movies/movie.model';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private movies: Movie[] = [];
  private moviesUpdated = new Subject<Movie[]>();
  private moviesRecommendedUpdated = new Subject<Movie[]>();

  constructor(private http: HttpClient, private router: Router) {}

  getMoviesByListType(listType: string) {
    this.http
      .get<{ message: string; movies: any[] }>(
        `http://localhost:3000/api/user/movies/list/${listType}`
      )
      .pipe(
        map((responseData) => {
          return responseData.movies.map((movie) => {
            return {
              title: movie.title,
              date: movie.date,
              list: movie.list,
              creator: movie.creator,
            };
          });
        })
      )
      .subscribe((mappedMovies) => {
        this.movies = mappedMovies;
        this.moviesUpdated.next([...this.movies]);
      });
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
            const newMovie = responseData.movie;
            this.movies.push(newMovie);
            this.moviesUpdated.next([...this.movies]);
            this.router.navigate(['/']);
            observer.next(responseData);
            observer.complete();
          },
          error: (error) => {
            observer.error(error);
          },
        });
    });
  }

  updateMovie(title: string, date: Date, list: string) {
    const updateData = { title, date, list };

    this.http
      .put(`http://localhost:3000/api/user/update-movie/${title}`, updateData)
      .subscribe((response) => {
        const updatedMovies = [...this.movies];
        const oldMovieIndex = updatedMovies.findIndex((m) => m.title === title);
        if (oldMovieIndex > -1) {
          updatedMovies[oldMovieIndex] = {
            ...updatedMovies[oldMovieIndex],
            title,
            date,
            list,
          };
          this.movies = updatedMovies;
          this.moviesUpdated.next([...this.movies]);
        }
      });
  }

  deleteMovie(movieTitle: string) {
    this.http
      .delete(`http://localhost:3000/api/user/delete-movie/${movieTitle}`)
      .subscribe(() => {
        this.movies = this.movies.filter((movie) => movie.title !== movieTitle);
        this.moviesUpdated.next([...this.movies]);
      });
  }

  deleteMovieRecommended(movieTitle: string) {
    this.http
      .delete(
        `http://localhost:3000/api/user/delete-movie-recommended/${movieTitle}`
      )
      .subscribe(() => {
        this.movies = this.movies.filter((movie) => movie.title !== movieTitle);
        this.moviesUpdated.next([...this.movies]);
      });
  }

  shareMovie(
    friendId: string,
    movieTitle: string,
    date: Date
  ): Observable<any> {
    return this.http
      .post<{ message: string }>('http://localhost:3000/api/user/share-movie', {
        friendId,
        movieTitle,
        date,
      })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du partage du film :', error);
          throw error;
        })
      );
  }

  // Méthode pour récupérer les films recommandés
  getMoviesRecommended(): void {
    this.http
      .get<{ movies: any[] }>(
        'http://localhost:3000/api/user/movies-recommended'
      )
      .pipe(
        map((responseData) => {
          return responseData.movies.map((movie) => ({
            id: movie._id,
            title: movie.title,
            date: movie.date,
            list: movie.list,
            creator: movie.creator,
          }));
        }),
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des films recommandés :',
            error
          );
          throw error; // Propager l'erreur pour qu'elle soit gérée par le composant appelant
        })
      )
      .subscribe((movies) => {
        this.moviesRecommendedUpdated.next(movies);
      });
  }

  // Méthode pour écouter les mises à jour des films recommandés
  getMoviesRecommendedUpdateListener(): Observable<Movie[]> {
    return this.moviesRecommendedUpdated.asObservable();
  }

  moveMovieToNormalList(movieTitle: string) {
    const updateData = { title: movieTitle };

    return this.http.post<{ message: string }>(
      'http://localhost:3000/api/user/move-movie-to-normal-list',
      updateData
    );
  }
}
