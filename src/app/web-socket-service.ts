// import { Injectable } from '@angular/core';
// import { io, Socket } from 'socket.io-client';
// import { Observable, fromEvent } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class WebSocketService {
//   private socket: Socket;

//   constructor() {
//     this.socket = io('http://localhost:3000');
//   }

//   onEvent<T>(event: string): Observable<T> {
//     return fromEvent<T>(this.socket, event);
//   }

//   emitEvent(event: string, data: any) {
//     this.socket.emit(event, data);
//   }
// }
