import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { Movie } from '../movie.model';
import { MoviesService } from '../movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { TmdbService } from 'src/app/tmdb.service';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';

@Component({
  selector: 'app-movie-list-done',
  templateUrl: './movie-list-done.component.html',
  styleUrls: ['./movie-list-done.component.css'],
})
export class MovieListDoneComponent implements OnInit, OnDestroy {
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
      'seen',
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
      'seen',
      this.moviesPerPage,
      this.currentPage
    );
  }

  // Méthode pour supprimer un film.
  onDelete(movieId: string) {
    const snackBarRef = this.snackBar.open(
      'Êtes-vous sûr de vouloir supprimer ce film ?',
      'Supprimer',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.moviesService.deleteMovie(movieId).subscribe(() => {
        this.moviesService.getMoviesByListType(
          'seen',
          this.moviesPerPage,
          this.currentPage
        );
      });
      this.snackBar.open('Film supprimé avec succès', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
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
          this.moviesService
            .shareMovie(
              result.friendId,
              result.movieTitle,
              result.date,
              result.tmdbId,
              result.friendComment
            )
            .subscribe({});
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
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
