import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatCoordinates',
})
export class FormatCoordinatesPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, ...args: unknown[]): SafeHtml {
    const t = value.split(',');
    const formattedCoordinates = `Longitude: ${t[0]} <br/> Latitude: ${t[1]}`;
    return this.sanitizer.bypassSecurityTrustHtml(formattedCoordinates);
  }
}
