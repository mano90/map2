import { Component } from '@angular/core';

import View from 'ol/View';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { LineString, Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
@Component({
  selector: 'app-device-settings',
  templateUrl: './device-settings.component.html',
  styleUrls: ['./device-settings.component.scss'],
})
export class DeviceSettingsComponent {
  map: Map;

  constructor() {}

  ngAfterViewInit(): void {
    this.initMap();
    this.addMovingMarker([5.8776, 52.1469], [6.2425, 53.1934]); // Example start and end points
  }

  initMap(): void {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([5, 52]),
        zoom: 7,
      }),
    });
  }
  addMovingMarker(startPoint: number[], endPoint: number[]): void {
    const markerStyle = new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: 'red' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
      }),
    });
    const lineStyle = new Style({
      stroke: new Stroke({ color: 'blue', width: 2 }),
    });
    const line = new LineString([fromLonLat(startPoint), fromLonLat(endPoint)]);
    const f = new Feature({
      geometry: line,
    });
    f.setStyle(lineStyle);

    const marker = new Feature({
      type: 'icon',
      geometry: new Point(fromLonLat(startPoint)),
    });
    marker.setStyle(markerStyle);

    const markerLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker],
      }),
    });

    this.map.addLayer(markerLayer);

    let i = 0;
    const steps = 100;
    const delta = 1 / steps;

    const moveMarker = () => {
      if (i < steps) {
        i++;
        const point = line.getCoordinateAt(i * delta);
        marker.getGeometry().setCoordinates(point);
        requestAnimationFrame(moveMarker);
      }
    };

    moveMarker();
  }
}
