import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Cela assure que le service est injecté au niveau de l'application
})
export class DateFormatService {
  formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = month < 10 ? `0${month}` : `${month}`;

    return `${formattedDay}/${formattedMonth}/${year}`;
  }
}
