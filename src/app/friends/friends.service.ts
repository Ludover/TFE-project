import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private apiUrl = 'http://localhost:3000/api/user';

  constructor(private http: HttpClient) {}

  addFriend(pseudo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-friend/${pseudo}`, {});
  }

  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friends`);
  }
}
