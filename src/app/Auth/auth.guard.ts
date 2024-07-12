import { AuthService } from './auth.service';
import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

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

export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | Observable<boolean> | Promise<boolean> => {
  return inject(PermissionsService).canActivate(route, state);
};
