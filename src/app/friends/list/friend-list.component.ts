import { Component, OnInit, OnDestroy } from '@angular/core';
import { FriendsService } from '../friends.service';
import { User } from '../user.model';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/Auth/auth.service';

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
    private authService: AuthService
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
    // Ajoutez la logique pour supprimer un ami ici
    console.log(`Removing friend with id: ${friendId}`);
    // Vous pouvez appeler un service pour supprimer l'ami et actualiser la liste des amis
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }
}
