import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/notifier.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent {
  isLoading = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notifierService: NotifierService
  ) {}

  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService
      .login(form.value.email.toLowerCase(), form.value.password)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.notifierService.showNotification(
            'Connexion réussie',
            'Fermer',
            'success'
          );
        },
        error: () => {
          this.isLoading = false;
          this.notifierService.showNotification(
            'Identifiant ou mot de passe incorrect',
            'Fermer',
            'info'
          );
        },
      });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']); // Redirige vers une nouvelle page pour la réinitialisation du mot de passe
  }
}
