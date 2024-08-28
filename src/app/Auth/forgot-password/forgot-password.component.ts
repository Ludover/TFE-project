import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  isLoading = false;

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  onForgotPassword(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.forgotPassword(form.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Lien de réinitialisation envoyé', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open("Erreur lors de l'envoi du lien", 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
    });
  }
}
