import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-movie-details-dialog',
  templateUrl: './movie-details-dialog.component.html',
  styleUrls: ['./movie-details-dialog.component.css'],
})
export class MovieDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MovieDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  // Permet de récupérer les genres.
  getGenreList(): string {
    return (
      this.data?.movie?.genres.map((genre: any) => genre.name).join(', ') || ''
    );
  }

  // Permet la récupération des acteurs.
  getActorList(): string {
    return (
      this.data?.movie?.credits.cast
        .slice(0, 5)
        .map((cast: any) => cast.name)
        .join(', ') || ''
    );
  }

  // Permet la récupération des réalisateurs.
  getCrewList(): string {
    return (
      this.data?.movie?.credits.crew
        .filter((crew: any) => crew.job === 'Director')
        .slice(0, 5)
        .map((cast: any) => cast.name)
        .join(', ') || ''
    );
  }
}
