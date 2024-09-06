import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotifierService {
  constructor(private snackBar: MatSnackBar) {}

  showNotification(
    displayMessage: string,
    buttonText: string,
    messageType: 'error' | 'success' | 'info'
  ) {
    return this.snackBar.open(displayMessage, buttonText, {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [messageType],
    });
  }
}
