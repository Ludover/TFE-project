import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FriendsService } from '../friends.service';
import { AuthService } from 'src/app/Auth/auth.service';
import { response } from 'express';

@Component({
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrls: ['./add-friend.component.css'],
})
export class AddFriendComponent implements OnInit, OnDestroy {
  pseudo: string = '';
  friends: any[] = [];
  isLoading = false;
  searchPerformed = false;
  userIsAuthenticated = false;
  private friendsSub?: Subscription;
  private authStatusSub: Subscription;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.userIsAuthenticated = isAuthenticated;
      });
  }

  onSearchFriend() {
    if (this.pseudo) {
      this.isLoading = true;
      // Récupérer le pseudo de l'utilisateur connecté
      this.authService.getUserPseudo().subscribe((userPseudo) => {
        // Vérifiez si l'utilisateur a recherché son propre pseudo
        if (this.pseudo === userPseudo.pseudo) {
          this.snackBar.open(
            'Vous ne pouvez pas vous ajouter comme ami.',
            'Fermer',
            {
              duration: 3000,
              verticalPosition: 'top',
            }
          );
          this.friends = []; // Réinitialise la liste des amis
          this.isLoading = false;
          return; // Sortir de la méthode si c'est le même utilisateur
        }

        this.friendsService.searchUserByPseudo(this.pseudo).subscribe({
          next: (response) => {
            this.friends = response ? [response] : [];
            this.isLoading = false;
            this.searchPerformed = true;
          },
          error: (error) => {
            this.isLoading = false;
            this.searchPerformed = true;
          },
        });
      });
    }
  }

  onAddFriend(friendId: string) {
    const snackBarRef = this.snackBar.open(
      'Voulez-vous ajouter cet ami ?',
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.friendsService.sendFriendRequest(friendId).subscribe({
        next: () => {
          this.snackBar.open("Demande d'ami envoyée avec succès", 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
          });
        },
        error: (error) => {
          if (
            error.status === 400 &&
            error.error.message === "Demande d'ami déjà envoyée."
          ) {
            this.snackBar.open(
              "Vous avez déjà envoyé une demande d'ami à cet utilisateur.",
              'Fermer',
              {
                duration: 3000,
                verticalPosition: 'top',
              }
            );
          } else {
            this.snackBar.open(
              "Erreur lors de l'envoi de la demande d'ami. Réessayez plus tard.",
              'Fermer',
              {
                duration: 3000,
                verticalPosition: 'top',
              }
            );
          }
        },
      });
    });
  }

  ngOnDestroy() {
    this.friendsSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
