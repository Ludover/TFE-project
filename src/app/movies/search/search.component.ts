import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MoviesService } from '../movies.service';
import { ShareMovieDialogComponent } from '../share-movie-dialog/share-movie-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog.component';
import { TmdbService } from 'src/app/tmdb.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { NotifierService } from 'src/app/notifier.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, OnDestroy {
  title: string = '';
  movies: any[] = [];
  isLoading: boolean = false;
  movieDetails: any;
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;
  performedSearch = false;

  totalMovies = 0;
  moviesPerPage = 20;
  currentPage = 1;

  constructor(
    private tmdbService: TmdbService,
    public moviesService: MoviesService,
    private notifierService: NotifierService,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  scrollTo(): void {
    const element = document.getElementById('top-movie');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Méthode pour rechercher les films avec un titre via l'API TMDB.
  searchMovies(page: number = this.currentPage) {
    if (this.title) {
      this.isLoading = true;
      this.tmdbService.searchMovie(this.title, page).subscribe({
        next: (response) => {
          this.movies = response.results || [];
          this.totalMovies = response.total_results;
          this.isLoading = false;
          this.performedSearch = true;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.searchMovies(this.currentPage);
    this.scrollTo();
  }

  // Méthode pour afficher via un dialog les détails d'un film.
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

  // Méthode permettant d'ajouter un film sélectionné dans la bdd.
  onSelectMovie(movie: any) {
    if (!this.UserIsAuthenticated) {
      this.notifierService.showNotification(
        'Vous devez être connecté pour ajouter un film à votre liste.',
        'Fermer',
        'info'
      );
      return;
    }

    this.moviesService.addMovie(movie).subscribe({
      next: () => {
        this.notifierService.showNotification(
          'Film ajouté avec succès',
          'Fermer',
          'success'
        );
      },
    });
  }

  // Méthode pour partager le film.
  onShare(movie: any) {
    if (!this.UserIsAuthenticated) {
      this.notifierService.showNotification(
        'Vous devez être connecté pour partager un film.',
        'Fermer',
        'info'
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

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
