import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  isLoading = false;
  private token: string;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.token = params['token'];
    });
  }

  onResetPassword(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.authService.resetPassword(this.token, form.value.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Mot de passe réinitialisé avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open(
          'La réinitialisation du mot de passe a échoué',
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
