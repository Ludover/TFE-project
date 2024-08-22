import { Component } from '@angular/core';
import { OmdbService } from 'src/app/omdb.service';
import { MoviesService } from '../movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { Movie } from '../movie.model';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';

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
    private omdbService: OmdbService,
    public moviesService: MoviesService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  searchMovies() {
    if (this.title) {
      this.isLoading = true;
      this.omdbService.searchMovie(this.title).subscribe((response) => {
        this.movies = response.Search || [];
        this.isLoading = false;
      });
    }
  }

  searchMovieById(id: string) {
    this.omdbService.searchMovieById(id).subscribe((response) => {
      if (response && response.Response !== 'False') {
        this.dialog.open(MovieDetailsDialogComponent, {
          width: '600px',
          data: { movie: response },
        });
      } else {
        console.error('Aucun film trouvé avec cet ID.');
      }
    });
  }

  onSelectMovie(movie: any) {
    this.moviesService.addMovie(movie).subscribe({
      next: () => {
        this.snackBar.open('Film ajouté avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
      // error: (error) => {
      //   if (
      //     error.status === 400 &&
      //     error.error.message === 'Ce film est déjà dans votre liste à voir.'
      //   ) {
      //     this.snackBar.open(
      //       'Ce film est déjà dans votre liste à voir.',
      //       'Fermer',
      //       {
      //         duration: 3000,
      //         verticalPosition: 'top',
      //       }
      //     );
      //   } else {
      //     this.snackBar.open(
      //       "Erreur lors de l'ajout du film. Réessayez plus tard.",
      //       'Fermer',
      //       {
      //         duration: 3000,
      //         verticalPosition: 'top',
      //       }
      //     );
      //   }
      // },
    });
  }

  onShare(movie: any) {
    const dialogRef = this.dialog.open(ShareMovieDialogComponent, {
      width: '400px',
      data: {
        movie: {
          title: movie.Title,
          date: new Date(),
          imdbId: movie.imdbID,
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
          // .subscribe({
          //   next: () => {
          //     this.snackBar.open('Film partagé avec succès', 'Fermer', {
          //       duration: 3000,
          //       verticalPosition: 'top',
          //     });
          //   },
          //   error: (error) => {
          //     // Vérifier si le message d'erreur est celui attendu
          //     const errorMessage =
          //       error.error.message || 'Erreur lors du partage du film';
          //     if (
          //       errorMessage === 'Ce film a déjà été conseillé à cet ami.'
          //     ) {
          //       this.snackBar.open(errorMessage, 'Fermer', {
          //         duration: 3000,
          //         verticalPosition: 'top',
          //       });
          //     } else {
          //       this.snackBar.open('Une erreur est survenue', 'Fermer', {
          //         duration: 3000,
          //         verticalPosition: 'top',
          //       });
          //     }
          //   },
          // });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la fermeture du dialog:', err);
      },
    });
  }
}
