import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private apiKey: string = '6682b7b9ef84fc27af0953c57630ff84';
  private apiUrl: string = `https://api.themoviedb.org/3/`;
  private bearerToken: string =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2NjgyYjdiOWVmODRmYzI3YWYwOTUzYzU3NjMwZmY4NCIsIm5iZiI6MTcyNDY3NDU2NS43NDg4MjgsInN1YiI6IjYyNmJiMGQwYTZjMTA0MDBhN2FmOWIwNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kr4mUVIfXT5ieyEMdQTamB6yanxUY1tM3Dg6RvVYqfw';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.bearerToken}`,
    });
  }

  getNowPlayingMovies(page: number): Observable<any> {
    const url = `${this.apiUrl}movie/now_playing?api_key=${this.apiKey}&language=fr-FR&page=${page}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  getTopRatedMovies(page: number): Observable<any> {
    const url = `${this.apiUrl}movie/top_rated?api_key=${this.apiKey}&language=fr-FR&page=${page}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  searchMovie(title: string): Observable<any> {
    const url = `${this.apiUrl}search/movie?api_key=${
      this.apiKey
    }&query=${encodeURIComponent(title)}&language=fr-FR`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  getMovieDetails(id: string): Observable<any> {
    const url = `${this.apiUrl}movie/${id}?api_key=${this.apiKey}&language=fr-FR&append_to_response=credits`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }
}
