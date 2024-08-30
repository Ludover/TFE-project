import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthData } from './auth-data.model';
import { AuthDataLogin } from './auth-data-login.model';

import { environment } from 'src/environments/environment';

const BACKEND_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private authStatusListener = new Subject<boolean>();
  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  // Méthode permettant la création de l'utilisateur.
  createUser(
    email: string,
    password: string,
    pseudo: string
  ): Observable<void> {
    const authData: AuthData = { email, password, pseudo };
    return this.http
      .post<{ message: string; result: any }>(`${BACKEND_URL}/signup`, authData)
      .pipe(
        map((response) => {
          this.router.navigate(['/signin']);
        }),
        catchError((error) => {
          console.error(error);
          return throwError(
            () => new Error("Une erreur est survenue lors de l'inscription.")
          );
        })
      );
  }

  // Méthode permettant à l'utilisateur de se connecter.
  login(email: string, password: string): Observable<void> {
    const AuthDataLogin: AuthDataLogin = { email, password };
    return this.http
      .post<{ token: string; expiresIn: number }>(
        `${BACKEND_URL}/login`,
        AuthDataLogin
      )
      .pipe(
        map((response) => {
          const token = response.token;
          this.token = token;
          if (token) {
            const expiresInDuration = response.expiresIn;
            this.setAuthTimer(expiresInDuration);
            this.tokenTimer = setTimeout(() => {
              this.logout();
            }, expiresInDuration * 1000);
            this.isAuthenticated = true;
            this.authStatusListener.next(true);
            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInDuration * 1000
            );
            this.saveAuthData(token, expirationDate);
            this.router.navigate(['/']);
          }
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${BACKEND_URL}/forgot-password`, {
      email: email,
    });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${BACKEND_URL}/reset-password`, {
      token: token,
      password: password,
    });
  }

  // Méthode pour vérifier si l'utilisateur est authentifié
  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      return;
    }
    const now = new Date();
    // Calcule la durée restante avant l'expiration du token.
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.setAuthTimer(expiresIn / 1000);

      // Permet d'informer les autres parties de l'application que l'utilisateur est authentifié.
      this.authStatusListener.next(true);
    }
  }

  // Méthode pour déconnecter l'utilisateur en supprimant les informations d'authentification
  // et en réinitialisant l'état de connexion.
  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(['/']);
  }

  // Méthode pour récupérer l'id de l'utilisateur.
  getUserId(): Observable<{ id: string }> {
    return this.http.get<{ id: string }>(`${BACKEND_URL}/id`);
  }

  // Méthode pour récupérer le pseudo de l'utilisateur.
  getUserPseudo(): Observable<any> {
    return this.http.get<any>(`${BACKEND_URL}/pseudo`);
  }

  // Configure un minuteur pour déconnecter automatiquement l'utilisateur lorsque le token expire.
  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  // Ca enregistre les infos d'authentification dans le stockage local du navigateur.
  private saveAuthData(token: string, expirationDate: Date) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
  }

  // Ca supprime les informations d'authentification du stockage local du navigateur.
  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
  }

  // Récupère les informations d'authentification depuis le stockage local du navigateur.
  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    if (!token || !expirationDate) {
      return null;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
    };
  }
}
