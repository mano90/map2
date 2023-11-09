import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import Map from 'ol/Map';
import ControlMousePosition from 'ol/control/MousePosition';
import { CoordinateFormatterService } from '../../services/coordinate-formatter.service';

@Component({
  selector: 'app-mouse-position',
  template: ``,
  styles: [
    `
      ::ng-deep .ol-scale-line {
        position: relative;
      }

      ::ng-deep .ol-scale-line,
      ::ng-deep .ol-scale-line-inner {
        background-color: transparent;
        border-color: var(--text-color);
        color: var(--text-color);
        font-size: inherit;
        bottom: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MousePositionComponent implements OnInit {
  @Input() map: Map;
  @Input() positionTemplate: string;
  control: ControlMousePosition;

  // @Output() close = new EventEmitter<any>();

  constructor(
    private element: ElementRef,
    private coordinateFormatter: CoordinateFormatterService
  ) {}

  ngOnInit() {
    this.control = new ControlMousePosition({
      className: 'mouseposition-control',
      coordinateFormat: (coordinates: number[]) => {
        this.coordinateFormatter.numberCoordinates(
          coordinates,
          4,
          this.positionTemplate
        );
        this.coordinateFormatter.changeMessage(coordinates);
        return "";
      },

      target: this.element.nativeElement,
      // undefinedHTML: undefined,
      projection: 'EPSG:4326',
    });
    this.map.addControl(this.control);
    // console.log(this.map.getCode());
  }
}
