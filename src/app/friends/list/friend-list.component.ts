import { Component, OnInit } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css'],
})
export class FriendListComponent implements OnInit {
  friends: User[] = [];
  isLoading = false;

  constructor(
    private friendsService: FriendsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.friendsService.getFriends().subscribe({
      next: (friends) => {
        this.friends = friends;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // Méthode pour supprimer un ami.
  removeFriend(friendId: string) {
    const snackBarRef = this.snackBar.open(
      'Voulez-vous vraiment supprimer cet ami ?',
      'Supprimer',
      {
        duration: 10000,
        verticalPosition: 'top',
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.friendsService.removeFriend(friendId).subscribe(() => {
        this.friends = this.friends.filter((friend) => friend._id !== friendId);
        this.snackBar.open('Ami supprimé avec succès', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      });
    });
  }
}
