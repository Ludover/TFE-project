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
  UserIsAuthenticated = false;

  constructor(
    private friendsService: FriendsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.friendsService.getFriendsRequestReceived().subscribe((friends) => {
      this.friends = friends;
    });
    this.UserIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((isAuthenticated) => {
        this.UserIsAuthenticated = isAuthenticated;
      });
  }

  // Méthode pour accepter une demande d'ami
  acceptFriendRequest(friendId: string) {
    this.friendsService.acceptFriendRequest(friendId).subscribe({
      next: () => {
        this.snackBar.open("Demande d'ami acceptée", 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
        this.removeFriendFromList(friendId);
      },
      error: (error) => {
        this.snackBar.open(
          "Erreur lors de l'acceptation de la demande",
          'Fermer',
          {
            duration: 3000,
            verticalPosition: 'top',
          }
        );
      },
    });
  }

  // Méthode pour rejeter une demande d'ami
  rejectFriendRequest(friendId: string) {
    this.friendsService.rejectFriendRequest(friendId).subscribe({
      next: () => {
        this.snackBar.open("Demande d'ami rejetée", 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
        this.removeFriendFromList(friendId);
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
        });
      },
    });
  }

  // Méthode pour supprimer un ami de la liste affichée
  removeFriendFromList(friendId: string) {
    this.friends = this.friends.filter((friend) => friend._id !== friendId);
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
