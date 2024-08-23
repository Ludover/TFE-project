import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private apiUrl = 'http://localhost:3000/api/user';
  private friendRequestsUpdated = new Subject<void>();

  constructor(private http: HttpClient) {}

  getFriendRequestsUpdatedListener() {
    return this.friendRequestsUpdated.asObservable();
  }

  searchUserByPseudo(pseudo: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search/${pseudo}`);
  }

  // Méthode pour envoyer une demande d'ami
  sendFriendRequest(friendId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-friend-request/${friendId}`, {});
  }

  // Méthode pour accepter une demande d'ami
  acceptFriendRequest(userId: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/accept-friend-request/${userId}`, {})
        .subscribe({
          next: (response) => {
            observer.next(response);
            this.friendRequestsUpdated.next();
          },
          error: (err) => {
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          },
        });
    });
  }

  // Méthode pour refuser une demande d'ami
  rejectFriendRequest(userId: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/reject-friend-request/${userId}`, {})
        .subscribe({
          next: (response) => {
            observer.next(response);
            this.friendRequestsUpdated.next();
          },
          error: (err) => {
            observer.error(err);
          },
          complete: () => {
            observer.complete();
          },
        });
    });
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

  // Méthode pour vérifier si un utilisateur est déjà dans la liste d'amis
  isFriend(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/is-friend/${userId}`);
  }
}
