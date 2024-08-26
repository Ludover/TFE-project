import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

// Le but est d'intercepter chaque requête HTTP envoyée par l'application.
// A chaque requête, la méthode ajoute un token d'authentification à l'en-tête de la requête.
// Cela permet de savoir si l'utilisateur est autorisé à accéder aux données.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authToken = this.authService.getToken();

    // Crée un clone de la requête en ajoutant le token.
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + authToken),
    });
    return next.handle(authRequest);
  }
}
