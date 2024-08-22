import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css'],
})
export class FriendListComponent implements OnInit, OnDestroy {
  friends: User[] = [];
  private authStatusSub: Subscription;
  UserIsAuthenticated = false;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.friendsService.getFriends().subscribe((friends) => {
      this.friends = friends;
    });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  removeFriend(friendId: string) {
    const snackBarRef = this.snackBar.open(
      'Voulez-vous vraiment supprimer cet ami ?',
      'Supprimer',
      {
        duration: 5000, // Durée avant que le snack-bar disparaisse
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

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
