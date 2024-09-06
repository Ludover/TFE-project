import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { NotifierService } from './notifier.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notifierService: NotifierService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && event.body.message) {
          this.notifierService.showNotification(
            event.body.message,
            'Fermer',
            'info'
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "Une erreur inattendue s'est produite!";
        if (error.error.message) {
          console.log(error);
          errorMessage = error.error.message;
        }
        if (
          error.status === 400 ||
          error.status === 200 ||
          error.status === 201
        ) {
          this.notifierService.showNotification(errorMessage, 'Fermer', 'info');
        } else {
          this.notifierService.showNotification(
            errorMessage,
            'Fermer',
            'error'
          );
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
