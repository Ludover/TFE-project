import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable()
export class SocketService {
  constructor(private socket: Socket) {}

  emitFriendRequest(request: any) {
    this.socket.emit('friendRequest', request);
  }

  receiveFriendRequest(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('friendRequest', (request: any) => {
        observer.next(request);
      });
    });
  }

  emitMovieRecommended(movie: any) {
    this.socket.emit('movieRecommended', movie);
  }

  receiveMovieRecommended(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('movieRecommended', (movie: any) => {
        observer.next(movie);
      });
    });
  }
}
