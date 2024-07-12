import { Component } from '@angular/core';
import { OmdbService } from 'src/app/omdb.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent {
  title: string = '';
  movies: any[] = [];
  isLoading: boolean = false;

  constructor(private omdbService: OmdbService) {}

  searchMovies() {
    if (this.title) {
      this.isLoading = true;
      this.omdbService.searchMovie(this.title).subscribe((response) => {
        this.movies = response.Search || [];
        this.isLoading = false;
      });
    }
  }
}
