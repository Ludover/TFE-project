import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.get<any>(url);
  }
}
