import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { NotifierService } from 'src/app/notifier.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  isLoading = false;

  constructor(
    private authService: AuthService,
    private notifierService: NotifierService
  ) {}

  onForgotPassword(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.forgotPassword(form.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.notifierService.showNotification(
          'Lien de réinitialisation envoyé',
          'Fermer',
          'success'
        );
      },
      error: () => {
        this.isLoading = false;
        this.notifierService.showNotification(
          "Erreur lors de l'envoi du lien",
          'Fermer',
          'error'
        );
      },
    });
  }
}
