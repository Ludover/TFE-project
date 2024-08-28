import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import { environment } from 'src/environments/environment';
import { User } from './user.model';

const BACKEND_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private friendRequestsUpdated = new Subject<void>();

  constructor(private http: HttpClient) {}

  getFriendRequestsUpdatedListener() {
    return this.friendRequestsUpdated.asObservable();
  }

  searchUserByPseudo(pseudo: string): Observable<User[]> {
    return this.http.get<User[]>(`${BACKEND_URL}/search/${pseudo}`);
  }

  // Méthode pour envoyer une demande d'ami
  sendFriendRequest(friendId: string): Observable<any> {
    return this.http.post(`${BACKEND_URL}/send-friend-request/${friendId}`, {});
  }

  // Méthode pour accepter une demande d'ami
  acceptFriendRequest(userId: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${BACKEND_URL}/accept-friend-request/${userId}`, {})
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
        .post(`${BACKEND_URL}/reject-friend-request/${userId}`, {})
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
      `${BACKEND_URL}/cancel-friend-request/${friendId}`,
      {}
    );
  }

  // Récupère les amis.
  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${BACKEND_URL}/friends`);
  }

  // Récupère les demandes d'amis envoyées.
  getFriendsRequestSent(): Observable<User[]> {
    return this.http.get<User[]>(`${BACKEND_URL}/friendRequestsSent`);
  }

  // Récupère les demandes d'amis reçues.
  getFriendsRequestReceived(): Observable<User[]> {
    return this.http.get<User[]>(`${BACKEND_URL}/friendRequestsReceived`);
  }

  // Méthode pour supprimer un ami.
  removeFriend(friendId: string): Observable<any> {
    return this.http.delete(`${BACKEND_URL}/remove-friend/${friendId}`);
  }

  // Méthode pour vérifier si un utilisateur est déjà dans la liste d'amis.
  isFriend(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${BACKEND_URL}/is-friend/${userId}`);
  }
}
