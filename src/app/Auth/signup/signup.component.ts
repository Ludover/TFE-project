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
    if (form.invalid) {
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
      });
  }
}
