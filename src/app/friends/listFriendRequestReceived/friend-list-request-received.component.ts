import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list-request-received',
  templateUrl: './friend-list-request-received.component.html',
  styleUrls: ['./friend-list-request-received.component.css'],
})
export class FriendListRequestReceivedComponent implements OnInit, OnDestroy {
  friends: User[] = [];
  private authStatusSub: Subscription;
  private friendRequestsUpdateSub: Subscription;
  UserIsAuthenticated = false;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadFriendRequests();
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });

    this.friendRequestsUpdateSub = this.friendsService
      .getFriendRequestsUpdatedListener()
      .subscribe(() => {
        this.loadFriendRequests(); // Recharger la liste des demandes après une mise à jour
      });
  }

  loadFriendRequests() {
    this.friendsService.getFriendsRequestReceived().subscribe((friends) => {
      this.friends = friends;
    });
  }

  // Méthode pour accepter une demande d'ami
  acceptFriendRequest(friendId: string) {
    this.friendsService.acceptFriendRequest(friendId).subscribe(() => {
      this.snackBar.open("Demande d'ami acceptée", 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
      this.removeFriendFromList(friendId);
    });
  }

  // Méthode pour rejeter une demande d'ami
  rejectFriendRequest(friendId: string) {
    this.friendsService.rejectFriendRequest(friendId).subscribe(() => {
      this.snackBar.open("Demande d'ami rejetée", 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
      this.removeFriendFromList(friendId);
    });
  }

  // Méthode pour supprimer un ami de la liste affichée
  removeFriendFromList(friendId: string) {
    this.friends = this.friends.filter((friend) => friend._id !== friendId);
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
    this.friendRequestsUpdateSub.unsubscribe();
  }
}
