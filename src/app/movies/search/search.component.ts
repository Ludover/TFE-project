import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MoviesService } from '../movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { Movie } from '../movie.model';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';
import { TmdbService } from 'src/app/tmdb.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent {
  title: string = '';
  movies: any[] = [];
  isLoading: boolean = false;
  movieDetails: any;

  constructor(
    private tmdbService: TmdbService,
    public moviesService: MoviesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService
  ) {}

  searchMovies() {
    if (this.title) {
      this.isLoading = true;
      this.tmdbService.searchMovie(this.title).subscribe((response) => {
        this.movies = response.results || [];
        this.isLoading = false;
      });
    }
  }

  searchMovieById(id: string) {
    this.tmdbService.getMovieDetails(id).subscribe((response) => {
      const isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
      const dialogWidth = isHandset ? '90vw' : '1000px';

      if (response && response.Response !== 'False') {
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

  onSelectMovie(movie: any) {
    if (!this.authService.getIsAuth()) {
      this.snackBar.open(
        'Vous devez être connecté pour ajouter un film à votre liste.',
        'Fermer',
        {
          duration: 3000,
          verticalPosition: 'top',
        }
      );
      return;
    }

    this.moviesService.addMovie(movie).subscribe({
      next: () => {
        this.snackBar.open('Film ajouté avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
    });
  }

  onShare(movie: any) {
    if (!this.authService.getIsAuth()) {
      this.snackBar.open(
        'Vous devez être connecté pour partager un film.',
        'Fermer',
        {
          duration: 3000,
          verticalPosition: 'top',
        }
      );
      return;
    }

    const isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
    const dialogWidth = isHandset ? '90vw' : '600px';

    const dialogRef = this.dialog.open(ShareMovieDialogComponent, {
      width: dialogWidth,
      maxWidth: '90vw',
      data: {
        movie: {
          title: movie.title,
          date: new Date(),
          tmdbId: movie.id,
        },
      },
    });
    console.log(dialogRef);
    console.log(movie);

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        console.log(result);
        if (result) {
          this.moviesService.shareMovie(
            result.friendId,
            result.movieTitle,
            result.date,
            result.imdb
          );
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
    });
  }
}
