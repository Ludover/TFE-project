import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotifierService } from 'src/app/notifier.service';

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
    private router: Router,
    private notifierService: NotifierService
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
        this.notifierService.showNotification(
          'Mot de passe réinitialisé avec succès',
          'Fermer',
          'success'
        );
        this.router.navigate(['/signin']);
      },
      error: () => {
        this.isLoading = false;
        this.notifierService.showNotification(
          'La réinitialisation du mot de passe a échoué',
          'Fermer',
          'error'
        );
      },
    });
  }
}
