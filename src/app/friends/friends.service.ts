import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private apiUrl = 'http://localhost:3000/api/user';

  constructor(private http: HttpClient) {}

  searchUserByPseudo(pseudo: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search/${pseudo}`);
  }

  // Méthode pour envoyer une demande d'ami
  sendFriendRequest(friendId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-friend-request/${friendId}`, {});
  }

  // Méthode pour accepter une demande d'ami
  acceptFriendRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/accept-friend-request/${userId}`, {});
  }

  // Méthode pour refuser une demande d'ami
  rejectFriendRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject-friend-request/${userId}`, {});
  }

  // Méthode pour annuler une demande d'ami envoyée
  cancelFriendRequest(friendId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/cancel-friend-request/${friendId}`,
      {}
    );
  }

  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friends`);
  }

  getFriendsRequestSent(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friendRequestsSent`);
  }

  getFriendsRequestReceived(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friendRequestsReceived`);
  }

  // Méthode pour supprimer un ami
  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove-friend/${friendId}`);
  }
}
