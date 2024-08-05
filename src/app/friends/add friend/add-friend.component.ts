import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FriendsService } from '../friends.service';

@Component({
  selector: 'app-add-friend',
  templateUrl: './add-friend.component.html',
  styleUrls: ['./add-friend.component.css'],
})
export class AddFriendComponent {
  constructor(private friendsService: FriendsService) {}

  onAddFriend(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.friendsService.addFriend(form.value.pseudo).subscribe({
      next: () => {
        form.reset();
        // Affichez un message de succès ici
      },
      error: () => {
        // Affichez un message d'erreur ici
      },
    });
  }
}
