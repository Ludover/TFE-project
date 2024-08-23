import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FriendsService } from '../friends.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

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
    private snackBar: MatSnackBar,
    private router: Router
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
    this.friendsService.isFriend(friendId).subscribe((isFriend: boolean) => {
      if (isFriend) {
        this.snackBar.open(
          "Cet utilisateur est déjà dans votre liste d'amis.",
          'Fermer',
          {
            duration: 3000,
            verticalPosition: 'top',
          }
        );
        this.router.navigate(['/addfriend']).then(() => {
          window.location.reload();
        });
        return;
      }

      const snackBarRef = this.snackBar.open(
        'Voulez-vous ajouter cet ami ?',
        'Oui',
        {
          duration: 5000,
          verticalPosition: 'top',
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.friendsService.sendFriendRequest(friendId).subscribe(() => {
          this.snackBar.open("Demande d'ami envoyée avec succès", 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
          });
          this.router.navigate(['/addfriend']).then(() => {
            window.location.reload();
          });
        });
      });
    });
  }

  ngOnDestroy() {
    this.friendsSub?.unsubscribe();
    this.authStatusSub.unsubscribe();
  }
}
