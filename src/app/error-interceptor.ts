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
  import { MatSnackBar } from '@angular/material/snack-bar';
  
  @Injectable()
  export class ErrorInterceptor implements HttpInterceptor {
    constructor(private snackBar: MatSnackBar) {}
  
    intercept(req: HttpRequest<any>, next: HttpHandler) {
      return next.handle(req).pipe(
        tap((event) => {
          if (event instanceof HttpResponse && event.body.message) {
            this.snackBar.open(event.body.message, 'Fermer', {
              duration: 3000,
              verticalPosition: 'top',
              panelClass: ['mat-toolbar', 'mat-accent'],
            });
          }
        }),
        catchError((error: HttpErrorResponse) => {
          let errorMessage = "Une erreur inattendue s'est produite!";
          if (error.error.message) {
            errorMessage = error.error.message;
          }
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['mat-toolbar', 'mat-warn'],
          });
          return throwError(() => new Error(errorMessage));
        })
      );
    }
  }
  