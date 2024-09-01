import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list-request-sent',
  templateUrl: './friend-list-request-sent.component.html',
  styleUrls: ['./friend-list-request-sent.component.css'],
})
export class FriendListRequestSentComponent implements OnInit {
  friends: User[] = [];
  isLoading = false;

  constructor(
    private friendsService: FriendsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.friendsService.getFriendsRequestSent().subscribe({
      next: (friends) => {
        this.friends = friends;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // Méthode pour annuler une demande d'ami
  cancelFriendRequest(friendId: string) {
    const snackBarRef = this.snackBar.open(
      "Êtes-vous sûr de vouloir annuler cette demande d'ami ?",
      'Oui',
      {
        duration: 5000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.friendsService.cancelFriendRequest(friendId).subscribe(() => {
        this.snackBar.open("Demande d'ami annulée", 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
        this.removeFriendFromList(friendId);
      });
    });
  }

  // Méthode pour supprimer une demande d'ami de la liste affichée
  removeFriendFromList(friendId: string) {
    this.friends = this.friends.filter((friend) => friend._id !== friendId);
  }
}
