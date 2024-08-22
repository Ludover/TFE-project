import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list-request-sent',
  templateUrl: './friend-list-request-sent.component.html',
  styleUrls: ['./friend-list-request-sent.component.css'],
})
export class FriendListRequestSentComponent implements OnInit, OnDestroy {
  friends: User[] = [];
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.friendsService.getFriendsRequestSent().subscribe((friends) => {
      this.friends = friends;
    });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  // Méthode pour annuler une demande d'ami
  cancelFriendRequest(friendId: string) {
    this.friendsService.cancelFriendRequest(friendId).subscribe(() => {
      this.snackBar.open("Demande d'ami annulée", 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
      });
      this.removeFriendFromList(friendId);
    });
  }

  // Méthode pour supprimer une demande d'ami de la liste affichée
  removeFriendFromList(friendId: string) {
    this.friends = this.friends.filter((friend) => friend._id !== friendId);
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
