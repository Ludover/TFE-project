import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  isLoading = false;

  constructor(public authService: AuthService, private snackBar: MatSnackBar) {}

  onSignup(form: NgForm) {
    // Vérifier si le formulaire est invalide
    if (form.invalid) {
      if (form.controls['password']?.errors?.['minlength']) {
        this.snackBar.open(
          'Le mot de passe doit comporter au moins 6 caractères.',
          'Fermer',
          {
            duration: 3000,
            verticalPosition: 'top',
          }
        );
      }
      return;
    }

    // Vérifier si le pseudo contient des espaces
    const pseudo = form.value.pseudo;
    if (/\s/.test(pseudo)) {
      this.snackBar.open(
        "Le pseudo ne doit pas contenir d'espaces.",
        'Fermer',
        {
          duration: 3000,
          verticalPosition: 'top',
        }
      );
      return;
    }

    this.isLoading = true;
    this.authService
      .createUser(form.value.email, form.value.password, form.value.pseudo)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open(
            "Votre inscription s'est bien effectuée.",
            'Fermer',
            {
              duration: 3000,
              verticalPosition: 'top',
            }
          );
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }
}
