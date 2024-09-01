import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FriendsService } from '../friends.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrls: ['./add-friend.component.css'],
})
export class AddFriendComponent {
  pseudo: string = '';
  friends: any[] = [];
  isLoading = false;
  searchPerformed = false;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  // Méthode pour rechercher un ami.
  onSearchFriend() {
    if (this.pseudo) {
      this.isLoading = true;
      // Récupérer le pseudo de l'utilisateur connecté

      this.friendsService.searchUserByPseudo(this.pseudo).subscribe({
        next: (response) => {
          this.friends = response;
          this.isLoading = false;
          this.searchPerformed = true;
        },
        error: () => {
          this.isLoading = false;
          this.searchPerformed = true;
        },
      });
    }
  }

  // Méthode pour ajouter un ami.
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
        });
      });
    });
  }
}
