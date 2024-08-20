import { Component } from '@angular/core';
import { OmdbService } from 'src/app/omdb.service';
import { MoviesService } from '../movies.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent {
  title: string = '';
  movies: any[] = [];
  isLoading: boolean = false;

  constructor(
    private omdbService: OmdbService,
    public moviesService: MoviesService,
    private snackBar: MatSnackBar
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

  onSelectMovie(movie: any) {
    const movieToAdd = {
      title: movie.Title,
      date: new Date(),
    };

    this.moviesService.addMovie(movieToAdd).subscribe({
      next: () => {
        this.snackBar.open('Film ajouté avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        if (
          error.status === 400 &&
          error.error.message === 'Ce film est déjà dans votre liste à voir.'
        ) {
          this.snackBar.open(
            'Ce film est déjà dans votre liste à voir.',
            'Fermer',
            {
              duration: 3000,
              verticalPosition: 'top',
            }
          );
        } else {
          this.snackBar.open(
            "Erreur lors de l'ajout du film. Réessayez plus tard.",
            'Fermer',
            {
              duration: 3000,
              verticalPosition: 'top',
            }
          );
        }
      },
    });
  }
}
