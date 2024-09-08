import { Component, OnInit } from '@angular/core';
import { FriendsService } from '../friends.service';
import { Friend } from '../friend.model';
import { NotifierService } from 'src/app/notifier.service';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css'],
})
export class FriendListComponent implements OnInit {
  friends: Friend[] = [];
  isLoading = false;

  constructor(
    private friendsService: FriendsService,
    private notifierService: NotifierService
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
    const snackBarRef = this.notifierService.showNotification(
      'Voulez-vous vraiment supprimer cet ami ?',
      'Supprimer',
      'info'
    );

    snackBarRef.onAction().subscribe(() => {
      this.friendsService.removeFriend(friendId).subscribe(() => {
        this.friends = this.friends.filter(
          (friend) => friend.friendId._id !== friendId
        );
        this.notifierService.showNotification(
          'Ami supprimé avec succès',
          'Fermer',
          'success'
        );
      });
    });
  }
}
