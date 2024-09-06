import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { NotifierService } from 'src/app/notifier.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  isLoading = false;

  constructor(
    public authService: AuthService,
    private notifierService: NotifierService
  ) {}

  onSignup(form: NgForm) {
    // Vérifier si le formulaire est invalide
    if (form.invalid) {
      if (form.controls['password']?.errors?.['minlength']) {
        this.notifierService.showNotification(
          'Le mot de passe doit comporter au moins 6 caractères.',
          'Fermer',
          'info'
        );
      }
      return;
    }

    // Vérifier si le pseudo contient des espaces
    const pseudo = form.value.pseudo;
    if (/\s/.test(pseudo)) {
      this.notifierService.showNotification(
        "Le pseudo ne doit pas contenir d'espaces.",
        'Fermer',
        'info'
      );
      return;
    }

    this.isLoading = true;
    this.authService
      .createUser(
        form.value.email.toLowerCase(),
        form.value.password,
        form.value.pseudo
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.notifierService.showNotification(
            "Votre inscription s'est bien effectuée.",
            'Fermer',
            'success'
          );
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }
}
