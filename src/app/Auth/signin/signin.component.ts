import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent {
  isLoading = false;

  constructor(
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.login(form.value.email, form.value.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Connexion réussie', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Identifiant ou mot de passe incorrect', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']); // Redirige vers une nouvelle page pour la réinitialisation du mot de passe
  }
}
