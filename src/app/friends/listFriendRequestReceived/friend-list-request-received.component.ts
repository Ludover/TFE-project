import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list-request-received',
  templateUrl: './friend-list-request-received.component.html',
  styleUrls: ['./friend-list-request-received.component.css'],
})
export class FriendListRequestReceivedComponent implements OnInit, OnDestroy {
  friends: User[] = [];
  isLoading = false;
  private friendRequestsUpdateSub: Subscription;
  userIsAuthenticated = false;

  constructor(
    private friendsService: FriendsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.loadFriendRequests();

    this.friendRequestsUpdateSub = this.friendsService
      .getFriendRequestsUpdatedListener()
      .subscribe(() => {
        // Recharger la liste des demandes après une mise à jour
        this.isLoading = true;
        this.loadFriendRequests();
      });
  }

  // Méthode pour récupérer les demandes d'amis reçues.
  loadFriendRequests() {
    this.friendsService.getFriendsRequestReceived().subscribe({
      next: (friends) => {
        this.friends = friends;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // Méthode pour accepter une demande d'ami.
  acceptFriendRequest(friendId: string) {
    this.friendsService.acceptFriendRequest(friendId).subscribe(() => {
      this.snackBar.open("Demande d'ami acceptée", 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
      this.removeFriendFromList(friendId);
    });
  }

  // Méthode pour rejeter une demande d'ami.
  rejectFriendRequest(friendId: string) {
    this.friendsService.rejectFriendRequest(friendId).subscribe(() => {
      this.snackBar.open("Demande d'ami rejetée", 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
      this.removeFriendFromList(friendId);
    });
  }

  // Méthode pour supprimer un ami de la liste affichée.
  removeFriendFromList(friendId: string) {
    this.friends = this.friends.filter((friend) => friend._id !== friendId);
  }

  ngOnDestroy() {
    this.friendRequestsUpdateSub.unsubscribe();
  }
}
