import { Component } from '@angular/core';

import { FriendsService } from '../friends.service';
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
    private notifierService: NotifierService
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
          console.log(this.friends.length);
          this.searchPerformed = true;
        },
        error: () => {
          this.isLoading = false;
          this.searchPerformed = false;
        },
      });
    }
  }

  // Méthode pour ajouter un ami.
  onAddFriend(friendId: string) {
    const snackBarRef = this.notifierService.showNotification(
      'Voulez-vous ajouter cet ami ?',
      'Oui',
      'info'
    );

    snackBarRef.onAction().subscribe(() => {
      this.friendsService.sendFriendRequest(friendId).subscribe(() => {});
    });
  }
}
