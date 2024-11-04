import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true, // Mark the pipe as standalone
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: number): string {
    if (value < 0) return 'Invalid time';

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;

    return [
      hours > 0 ? `${hours} heure${hours !== 1 ? 's' : ''}` : '',
      minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '',
      `${seconds} seconde${seconds !== 1 ? 's' : ''}`,
    ]
      .filter(Boolean) // Remove empty strings
      .join(', ');
  }
}
