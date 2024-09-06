import { Component } from '@angular/core';

import { FriendsService } from '../friends.service';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/notifier.service';

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
    private notifierService: NotifierService,
    private router: Router
  ) {}

  // Méthode pour rechercher un ami.
  onSearchFriend() {
    if (this.pseudo) {
      this.isLoading = true;
      // Récupérer le pseudo de l'utilisateur connecté

      if (this.pseudo.trim().length < 3) {
        this.notifierService.showNotification(
          'Le pseudo doit contenir au moins 3 caractères',
          'Fermer',
          'info'
        );
        this.isLoading = false;
        return;
      }

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
        this.notifierService.showNotification(
          "Cet utilisateur est déjà dans votre liste d'amis.",
          'Fermer',
          'info'
        );
        this.router.navigate(['/addfriend']).then(() => {
          window.location.reload();
        });
        return;
      }

      const snackBarRef = this.notifierService.showNotification(
        'Voulez-vous ajouter cet ami ?',
        'Oui',
        'info'
      );

      snackBarRef.onAction().subscribe(() => {
        this.friendsService.sendFriendRequest(friendId).subscribe(() => {
          this.notifierService.showNotification(
            "Demande d'ami envoyée avec succès",
            'Fermer',
            'success'
          );
        });
      });
    });
  }
}
