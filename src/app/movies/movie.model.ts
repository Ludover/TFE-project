export interface Movie {
  id: string;
  title: string;
  date: Date;
  dateSeen: Date;
  list?: string;
  creator?: string;
  friendComment?: string;
  tmdbId: string;
}
