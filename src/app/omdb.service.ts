import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OmdbService {
  private apiKey: string = '8cdca6d5';
  private apiUrl: string = `http://www.omdbapi.com/?apikey=${this.apiKey}&`;

  constructor(private http: HttpClient) {}

  searchMovie(title: string): Observable<any> {
    const url = `${this.apiUrl}s=${title}`;
    const headers = new HttpHeaders();
    return this.http.get<any>(url, { headers });
  }

  searchMovieById(id: string): Observable<any> {
    const url = `${this.apiUrl}i=${id}`;
    const headers = new HttpHeaders();
    return this.http.get<any>(url, { headers });
  }
}
