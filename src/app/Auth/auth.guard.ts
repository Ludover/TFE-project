import { AuthService } from './auth.service';
import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

// Service de gestion des autorisations.
// Il est utilisé pour vérifier si l'utilisateur est authentifié avant de permettre l'accès à certaines routes.

@Injectable({ providedIn: 'root' })
class PermissionsService {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    const isAuth = this.authService.getIsAuth();
    if (!isAuth) {
      this.router.navigate(['/signin']);
    }
    return isAuth;
  }
}

// Fonction de garde de route pour vérifier les autorisations.
export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | Observable<boolean> | Promise<boolean> => {
  // Utilise l'injection pour obtenir une instance du PermissionsService et appeler sa méthode canActivate
  return inject(PermissionsService).canActivate(route, state);
};
