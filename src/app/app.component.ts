import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';

import { unByKey } from 'ol/Observable';
import { getVectorContext } from 'ol/render';
import Polyline from 'ol/format/Polyline';
import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj.js';
import { Vector as VectorLayer } from 'ol/layer';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { easeOut } from 'ol/easing';
import XYZ from 'ol/source/XYZ';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { getDistance } from 'ol/sphere';
import { RtaService } from './components/rta/rta.service';
import { Locate } from './classes/locate';
import { Time } from '@angular/common';
import { CoordinateFormatterService } from './services/coordinate-formatter.service';
import { Geometry } from 'ol/geom';
import { faker } from '@faker-js/faker';

const DATES: string[] = ['2022-02-02', '2022-02-03'];
const IMEIS: string[] = ['751345975112', '891144473251'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  coordinates: number[] = [];
  currentCoordinates: number[] = [];
  map: Map;
  vectorSource: VectorSource = new VectorSource();
  vectorLayer: VectorLayer<any> = new VectorLayer();
  dates: string[] = DATES;
  imeis: string[] = IMEIS;

  selectedDate: string = 'All';
  selectedImei: string = 'All';

  allLocates: Locate[] = [];
  duration: number = 3000;
  tileLayer: TileLayer<any>;
  scroll = false;
  timeout: any;
  endFeature: Feature[] = [];
  debut: boolean = false;
  fin: boolean = false;
  timeBegin: Time;
  timeEnd: Time;
  constructor(
    private coordinateFormatterService: CoordinateFormatterService,
    private _rta: RtaService
  ) {}

  ngOnInit(): void {
    this.coordinateFormatterService.currentMessage.subscribe((data) => {
      this.coordinates = data;
    });

    const attributions =
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';
    this.tileLayer = new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        tileSize: 512,
      }),
    });
    this.map = new Map({
      view: new View({
        center: fromLonLat([48.93255, -19.1555]),
        zoom: 6,
      }),
      layers: [
        this.tileLayer,
        new VectorLayer({
          source: this.vectorSource,
        }),
      ],
    });

    for (let index = 0; index < 3; index++) {
      this.allLocates.push(this.generateData());
    }
    this.pasteData();

    // this._rta.getListeLocalisation().subscribe((res: Locate[]) => {
    //   this.allLocates = res;
    //   this.mapFunction(this.getSegments(this.allLocates));
    // });
    // this._rta
    //   .getServerSentEvent('http://localhost:3000/getData')
    //   .subscribe((data) => {
    //     const da: any = JSON.parse(data.data);
    //     // da.msg.forEach((element) => {
    //     //   console.log(element.after);
    //     // });

    //     const filtredImei: number[] = da.msg.map((item) => {
    //       return item.after.id;
    //     });
    //     console.log(filtredImei);
    //     this._rta.getItemsById(filtredImei).subscribe((res: Locate[]) => {
    //       // console.log(res);
    //       this.allLocates.push(...res);
    //       this.pasteData();
    //     });
    //   });
  }

  generateData() {
    return {
      // date: new Date('2022-01-02'),
      date: faker.date.between({ from: '2020-01-01', to: '2020-30-01' }),
      device: {
        color: faker.color.rgb(),
        // color: 'rgb(45, 210, 120)',
        imei: 'imei',
        nom: 'nom',
      },
      longitude: faker.number.float({
        min: 42.1813607109089,
        max: 48.1813607109089,
      }),
      latitude: faker.number.float({
        min: -16.42623231077009,
        max: -12.42623231077009,
      }),
    };
  }

  pasteData() {
    // Filter les données pour les requête par date et par téléphone
    const date: string = this.selectedDate;
    const imei: string = this.selectedImei;
    let newArray: Locate[] = this.allLocates;
    if (this.selectedDate !== 'All') {
      newArray = newArray.filter((item) => {
        const date1: Date = new Date(date);
        const date2: Date = new Date(item.date);
        if (
          date1.getFullYear() == date2.getFullYear() &&
          date1.getMonth() == date2.getMonth() &&
          date1.getDate() == date2.getDate()
        )
          return true;
        else return false;
      });
      if (this.debut === true) {
        newArray = newArray.filter((item) => {
          const date1: Date = new Date(date + 'T' + this.timeBegin);
          const date2: Date = new Date(item.date);
          if (date1.getTime() <= date2.getTime()) return true;
          else return false;
        });
      }
      if (this.fin === true) {
        newArray = newArray.filter((item) => {
          const date1: Date = new Date(date + 'T' + this.timeEnd);
          const date2: Date = new Date(item.date);
          if (date1.getTime() > date2.getTime()) return true;
          else return false;
        });
      }
    }

    if (this.selectedImei !== 'All') {
      newArray = newArray.filter((item) => {
        return item.device.imei == imei;
      });
    }
    // Need to clear data before assign new data
    this.vectorSource.clear();
    // refresh data in map
    this.mapFunction(this.getSegments(newArray));
  }

  changeDate(event: any) {
    // Filter date
    this.selectedDate = event.target.value;
  }
  changeTelephone(event: any) {
    // Filter Imei
    this.selectedImei = event.target.value;
  }

  getSegments(da: Locate[]): Feature[] {
    this.endFeature = [];
    let segment: Feature[] = [];
    // get all imeis in data
    let localImei: string[] = da.map((element) => {
      return element.device.imei;
    });

    const unique = (value: any, index: any, self: any) => {
      return self.indexOf(value) === index;
    };
    // delete duplicate imei in data
    localImei = localImei.filter(unique);

    for (let i = 0; i < localImei.length; i++) {
      const orderedData: Locate[] = da
        // filter data by Imei
        .filter((element) => {
          return element.device.imei == localImei[i];
        })
        // arange data by date
        .sort((a, b) => {
          const da = new Date(a.date);
          const db = new Date(b.date);
          if (da < db) return -1;
          if (da > db) return 1;
          return 1;
        });
      // Constitute the segments, any ambanymbany any
      const dt: any[] = orderedData.map((element) => {
        return fromLonLat([element.longitude, element.latitude]);
      });
      // Opacity for first point = 0.7 and for end of traject  = 1
      let d: number = 0;
      let opacity: number = 1;
      const orderedDataLength: number = orderedData.length - 1;
      orderedData.map((element) => {
        if (d === 0) {
          opacity = 0.7;
        } else {
          opacity = 1;
        }
        // Each points of map
        let feat: Feature = new Feature({
          type: 'icon',
          geometry: new Point(
            fromLonLat([element.longitude, element.latitude])
          ),
        });
        feat.setStyle(
          new Style({
            image: new Icon({
              // color: JSON.parse(element.device.color),
              crossOrigin: 'anonymous',
              src: 'assets/dot.png',
              size: [20, 20],

              opacity: opacity,
            }),
            text: new Text({
              textBaseline: 'bottom',
              offsetY: -15,
              font: '12px Calibri,sans-serif',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({
                color: '#fff',
                width: 4,
              }),
              text: '',
              // 'Date: ' +
              // this.formatTime(new Date(element.date).getDate()) +
              // '/' +
              // this.formatTime(new Date(element.date).getMonth()) +
              // '/' +
              // new Date(element.date).getFullYear() +
              // 'T' +
              // this.formatTime(new Date(element.date).getHours()) +
              // ':' +
              // this.formatTime(new Date(element.date).getMinutes()) +
              // ':' +
              // this.formatTime(new Date(element.date).getSeconds()),
            }),
          })
        );
        if (d === orderedDataLength) {
          this.endFeature.push(feat);
        }
        d++;
        segment.push(feat);
      });

      let distance: number = 0;
      // Get distance of each segment and add to global distance in meter
      for (let j = 0; j < orderedData.length - 1; j++) {
        distance += getDistance(
          [orderedData[j].longitude, orderedData[j].latitude],
          [orderedData[j + 1].longitude, orderedData[j + 1].latitude]
        );
      }
      // Get time between first element and last
      const time: number =
        (new Date(orderedData[orderedData.length - 1].date).getTime() -
          new Date(orderedData[0].date).getTime()) /
        (1000 * 3600);
      // console.log(time);
      // set distance in kilometer
      let vitesse: number = 0;
      if (time === 0) {
        vitesse = 0;
        distance = 0;
      } else {
        distance /= 1000;
        vitesse = distance / time;
        vitesse = Math.round(vitesse);
        distance = Math.round(distance);
      }

      let segmReturn = new Feature({
        geometry: new LineString([...dt]),
      });

      // style of segments and push it
      segmReturn.setStyle(
        new Style({
          stroke: new Stroke({
            color: '#d12710',
            width: 2,
          }),
          text: new Text({
            font: '12px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({
              color: '#fff',
              width: 4,
            }),
            // text: 'Distance: ' + distance + 'km Vitesse: ' + vitesse + 'km/h',
            text: '',
          }),
        })
      );
      segment.push(segmReturn);
    }
    return segment;
  }

  mapFunction(segments: Feature[]) {
    // add feature to the vector source
    this.vectorSource.addFeatures([...segments]);
  }

  flash(features: Feature[]) {
    const start = Date.now();

    let flashGeom: any[] = features.map((element) => {
      return element.getGeometry().clone();
    });
    const listenerKey = this.tileLayer.on('postrender', (event) => {
      const frameState = event.frameState;
      const elapsed = frameState.time - start;
      if (elapsed >= this.duration) {
        unByKey(listenerKey);
        return;
      }
      const vectorContext = getVectorContext(event);
      const elapsedRatio = elapsed / this.duration;
      // radius will be 5 at start and 30 at end.
      const radius = easeOut(elapsedRatio) * 25 + 5;
      const opacity = easeOut(1 - elapsedRatio);
      const style = new Style({
        image: new CircleStyle({
          radius: radius,
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, ' + opacity + ')',
            width: 0.25 + opacity,
          }),
        }),
      });
      vectorContext.setStyle(style);
      for (let x = 0; x < flashGeom.length; x++) {
        vectorContext.drawGeometry(flashGeom[x]);
      }
      // vectorContext.drawGeometry(...flashGeom);
      this.map.render();
    });
  }

  formatTime(nombre: number): string {
    if (nombre < 10) {
      return '0' + nombre;
    }
    return nombre.toString();
  }

  clickMapa() {
    this.currentCoordinates = this.coordinates;
    // this.map.forEachLayerAtPixel(this.map.getEventPixel(event));
    // to get the layers to use for .getSource().getGetFeatureInfoUrl()
  }
  @HostListener('wheel', ['$event'])
  onScroll(event) {
    this.scroll = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.flash(this.endFeature);
      this.scroll = false;
    }, 300);
  }
}
