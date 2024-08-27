import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { MoviesService } from '../movies.service';
import { TmdbService } from 'src/app/tmdb.service';
import { Movie } from '../movie.model';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.css'],
})
export class MovieListComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading = false;
  private moviesSub?: Subscription;
  totalMovies = 0;
  moviesPerPage = 10;
  currentPage = 1;
  pageSizeOptions = [5, 10, 20];

  constructor(
    public moviesService: MoviesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private tmdbService: TmdbService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.moviesService.getMoviesByListType(
      'tosee',
      this.moviesPerPage,
      this.currentPage
    );
    this.moviesSub = this.moviesService
      .getMovieUpdateListener()
      .subscribe((movieData: { movies: Movie[]; movieCount: number }) => {
        this.isLoading = false;
        this.totalMovies = movieData.movieCount;
        this.movies = movieData.movies;
      });
  }

  // Méthode lors du changement de page afin de récupérer les données pour la suivante.
  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.moviesPerPage = pageData.pageSize;
    this.moviesService.getMoviesByListType(
      'tosee',
      this.moviesPerPage,
      this.currentPage
    );
  }

  // Méthode pour supprimer un film.
  onDelete(movieId: string) {
    const snackBarRef = this.snackBar.open(
      'Êtes-vous sûr de vouloir supprimer ce film ?',
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.moviesService.deleteMovie(movieId).subscribe(() => {
        this.moviesService.getMoviesByListType(
          'tosee',
          this.moviesPerPage,
          this.currentPage
        );
      });
    });
  }

  // Méthode pour mettre à jour le film avec la liste à "vu".
  updateAsSeen(movie: Movie) {
    const snackBarRef = this.snackBar.open(
      `Êtes-vous sûr de vouloir marquer "${movie.title}" comme vu ?`,
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['mat-toolbar', 'mat-primary'],
      }
    );

    snackBarRef.onAction().subscribe(() => {
      // Appeler le service pour mettre à jour le film
      this.moviesService.updateMovie(movie, 'seen').subscribe({
        next: () => {
          // Rafraîchir la liste des films après la mise à jour réussie
          this.moviesService.getMoviesByListType(
            'tosee',
            this.moviesPerPage,
            this.currentPage
          );
        },
      });
    });
  }

  // Méthode pour partager le film.
  onShare(movie: Movie) {
    const isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
    const dialogWidth = isHandset ? '90vw' : '600px';

    const dialogRef = this.dialog.open(ShareMovieDialogComponent, {
      width: dialogWidth,
      maxWidth: '90vw',
      data: { movie: movie },
    });
    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          console.log(result);
          this.moviesService
            .shareMovie(
              result.friendId,
              result.movieTitle,
              result.date,
              result.tmdbId
            )
            .subscribe({});
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
    });
  }

  // Méthode afin de proposer aléatoirement un film parmi la liste des films à voir.
  onFindRandomMovie() {
    this.moviesService.getRandomMovie().subscribe((movie) => {
      if (movie) {
        this.searchMovieById(movie.tmdbId);
      } else {
        console.error('Aucun film aléatoire trouvé.');
      }
    });
  }

  // Méthode pour afficher via un dialog les détails d'un film.
  searchMovieById(id: string) {
    this.tmdbService.getMovieDetails(id).subscribe((response) => {
      if (response && response.Response !== 'False') {
        const isHandset = this.breakpointObserver.isMatched(
          Breakpoints.Handset
        );
        const dialogWidth = isHandset ? '90vw' : '1000px';

        this.dialog.open(MovieDetailsDialogComponent, {
          width: dialogWidth,
          maxWidth: '90vw',
          data: { movie: response },
        });
      } else {
        console.error('Aucun film trouvé avec cet ID.');
      }
    });
  }

  ngOnDestroy() {
    this.moviesSub?.unsubscribe();
  }
}
