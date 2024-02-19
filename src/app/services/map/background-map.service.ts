import { Injectable } from '@angular/core';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

@Injectable({
  providedIn: 'root',
})
export class BackgroundMapService {
  readonly attributions =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

  private backgroundLayers: any[] = [
    {
      name: 'Standard',
      top: '100px',
      background: '../../assets/icons/osm.png',
      layer: new TileLayer({
        source: new XYZ({
          attributions: this.attributions,
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          tileSize: 512,
        }),
      }),
    },
    {
      name: 'Transport',
      top: '140px',
      background: '../../assets/icons/transport.png',
      layer: new TileLayer({
        source: new XYZ({
          url: 'https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=8261d7b77cf5404dba7bdcfcd889de26',
        }),
      }),
    },
    {
      name: 'Carte cyclable',
      top: '180px',
      background: '../../assets/icons/cycle.png',
      layer: new TileLayer({
        source: new XYZ({
          attributions: this.attributions,
          url: 'https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
          tileSize: 512,
        }),
      }),
    },
    {
      name: 'Here Tile',
      top: '220px',
      background: '../../assets/icons/here-tile.png',
      layer: new TileLayer({
        source: new XYZ({
          url: 'https://{1-4}.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png?apiKey=your-api-key',
          attributions: '© HERE 2024',
          maxZoom: 20,
        }),
      }),
    },
  ];

  getBackgroundLayers(): any[] {
    return this.backgroundLayers;
  }
}
