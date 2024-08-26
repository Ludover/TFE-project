import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FriendsService } from 'src/app/friends/friends.service'; // Assurez-vous que AuthService est correctement importé

@Component({
  selector: 'app-share-movie-dialog',
  templateUrl: './share-movie-dialog.component.html',
  styleUrls: ['./share-movie-dialog.component.css'],
})
export class ShareMovieDialogComponent {
  friends: any[] = [];
  selectedFriendId: string = '';

  constructor(
    public dialogRef: MatDialogRef<ShareMovieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private friendsService: FriendsService
  ) {
    this.friendsService.getFriends().subscribe((friends) => {
      this.friends = friends;
    });
  }

  onShare() {
    this.dialogRef.close({
      friendId: this.selectedFriendId,
      movieTitle: this.data.movie.title,
      date: new Date(),
      tmdbId: this.data.movie.tmdbId,
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
