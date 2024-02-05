import {
  AfterViewInit,
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
import Overlay from 'ol/Overlay';

import { unByKey } from 'ol/Observable';
import { getVectorContext } from 'ol/render';
import Polyline from 'ol/format/Polyline';
import Feature from 'ol/Feature';
import { fromLonLat, toLonLat } from 'ol/proj.js';
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
import { defaults as defaultInteractions } from 'ol/interaction';
import { toStringHDMS } from 'ol/coordinate.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';

const DATES: string[] = ['2022-02-02', '2022-02-03'];
const IMEIS: string[] = ['751345975112', '891144473251'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('content') content: ElementRef;
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
  hereLayer: TileLayer<any>;
  scroll = false;
  timeout: any;
  endFeature: Feature[] = [];
  debut: boolean = false;
  fin: boolean = false;
  timeBegin: Time;
  timeEnd: Time;
  overlay: Overlay;
  constructor(
    private coordinateFormatterService: CoordinateFormatterService,
    private _rta: RtaService,
    public modal: NgbModal,
    private spinner: NgxSpinnerService
  ) {}

  ngAfterViewInit(): void {
    this.map.on('click', (event) => {});
  }

  ngOnInit(): void {
    this.spinner.show();

    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    this.overlay = new Overlay({
      element: container!,
      autoPan: true,
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
    this.hereLayer = new TileLayer({
      source: new XYZ({
        attributions: '@ Here 2023',
        url: 'https://2.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png?apiKey=slxATAloyROzSmRPPepO0Hx1dNOrxwSlo2UCCdBXgvY',
      }),
    });
    this.map = new Map({
      view: new View({
        center: fromLonLat([48.93255, -19.1555]),
        zoom: 6,
      }),
      interactions: defaultInteractions({
        doubleClickZoom: false,
      }),
      layers: [
        this.tileLayer,
        // this.hereLayer,
        new VectorLayer({
          source: this.vectorSource,
        }),
      ],
      overlays: [this.overlay],
    });

    for (let index = 0; index < 10; index++) {
      this.allLocates.push(this.generateData());
    }
    this.pasteData();
    this.map.on('click', (event) => {
      const feature = this.map.forEachFeatureAtPixel(
        event.pixel,
        function (feature) {
          return feature;
        }
      );
      if (feature) {
        content!.innerHTML = '';
        const imei = feature.getProperties()['imei'];
        this.generatePopupContent(imei).map((item) => content!.append(item));
        const coordinate = event.coordinate;
        this.overlay.setPosition(coordinate);
      } else {
        this.overlay.setPosition(undefined);
      }
    });
  }

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

  generatePopupContent(imei: string): HTMLElement[] {
    const deplacement = this.formatButton(document.createElement('button'));
    deplacement.innerHTML = 'History';
    deplacement.addEventListener('click', () => {
      this.getDeplacements(imei);
      this.overlay.setPosition(undefined);
    });
    const maintenance = this.formatButton(document.createElement('button'));
    maintenance.innerHTML = 'Maintenance';
    maintenance.addEventListener('click', () => {
      this.getMaintenances(imei);
      this.overlay.setPosition(undefined);
    });
    const settings = this.formatButton(document.createElement('button'));
    settings.innerHTML = 'Settings';
    settings.addEventListener('click', () => {
      this.getSettings(imei);
      this.overlay.setPosition(undefined);
    });
    const deplacementContainer = document.createElement('div');
    const maintenanceContainer = document.createElement('div');
    const settingsContainer = document.createElement('div');
    deplacementContainer.style.paddingBottom = '2px';
    maintenanceContainer.style.paddingBottom = '2px';
    deplacementContainer.append(deplacement);
    maintenanceContainer.append(maintenance);
    settingsContainer.append(settings);

    return [deplacementContainer, maintenanceContainer, settingsContainer];
  }
  formatButton(document: HTMLButtonElement): HTMLButtonElement {
    document.style.cssText = `
    width: 150px;
    align-self: center;
    background-color: #fff;
    background-image: none;
    background-position: 0 90%;
    background-repeat: repeat no-repeat;
    background-size: 4px 3px;
    border-radius: 15px 225px 255px 15px 15px 255px 225px 15px;
    border-style: solid;
    border-width: 2px;
    box-shadow: rgba(0, 0, 0, .2) 15px 28px 25px -18px;
    box-sizing: border-box;
    color: #41403e;
    cursor: pointer;
    display: inline-block;
    font-family: Neucha, sans-serif;
    font-size: 1rem;
    line-height: 23px;
    outline: none;
    padding: .75rem;
    text-decoration: none;
    transition: all 235ms ease-in-out;
    border-bottom-left-radius: 15px 255px;
    border-bottom-right-radius: 225px 15px;
    border-top-left-radius: 255px 15px;
    border-top-right-radius: 15px 225px;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    transition-duration: 0.2s;
`;
    document.addEventListener('mouseover', function () {
      this.style.boxShadow = 'rgba(0, 0, 0, .3) 2px 8px 8px -5px';
      this.style.transform = 'translate3d(0, 2px, 0)';
    });

    document.addEventListener('mouseout', function () {
      this.style.boxShadow = '';
      this.style.transform = '';
    });

    document.addEventListener('focus', function () {
      this.style.boxShadow = 'rgba(0, 0, 0, .3) 2px 8px 4px -6px';
    });

    document.addEventListener('click', function () {
      this.style.backgroundColor = 'red';
    });
    return document;
  }
  getDeplacements(imei: string) {
    console.log('get history', imei);
  }
  getMaintenances(imei: string) {
    console.log('get maintenances', imei);
  }
  getSettings(imei: string) {
    console.log('get settings', imei);
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }
  generateData() {
    return {
      date: faker.date.between({ from: '2020-01-01', to: '2020-30-01' }),
      device: {
        color: faker.color.rgb(),
        imei: faker.number.int({ max: 10, min: 1 }).toString(),
        nom: 'nom',
      },
      longitude: faker.number.float({
        min: 42.1813607109089,
        max: 60.1813607109089,
      }),
      latitude: faker.number.float({
        min: -20.42623231077009,
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
    this.vectorSource.clear();
    this.mapFunction(this.getPoints(newArray));
    // this.mapFunction(this.getSegments(newArray));
  }

  changeDate(event: any) {
    // Filter date
    this.selectedDate = event.target.value;
  }
  changeTelephone(event: any) {
    // Filter Imei
    this.selectedImei = event.target.value;
  }

  getPoints(features: Locate[]): Feature[] {
    const points: Feature[] = [];
    for (let feature of features) {
      let feat: Feature = new Feature({
        type: 'icon',
        geometry: new Point(fromLonLat([feature.longitude, feature.latitude])),
      });
      feat.set('imei', feature.device.imei);
      feat.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'assets/locationIcons/2.png',
            scale: [0.09, 0.09],
            opacity: 1,
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
          }),
        })
      );
      points.push(feat);
    }
    return points;
  }

  // getSegments(da: Locate[]): Feature[] {
  //   this.endFeature = [];
  //   let segment: Feature[] = [];
  //   // get all imeis in data
  //   let localImei: string[] = da.map((element) => {
  //     return element.device.imei;
  //   });

  //   const unique = (value: any, index: any, self: any) => {
  //     return self.indexOf(value) === index;
  //   };
  //   // delete duplicate imei in data
  //   localImei = localImei.filter(unique);

  //   for (let i = 0; i < localImei.length; i++) {
  //     const orderedData: Locate[] = da
  //       // filter data by Imei
  //       .filter((element) => {
  //         return element.device.imei == localImei[i];
  //       })
  //       // arange data by date
  //       .sort((a, b) => {
  //         const da = new Date(a.date);
  //         const db = new Date(b.date);
  //         if (da < db) return -1;
  //         if (da > db) return 1;
  //         return 1;
  //       });
  //     // Constitute the segments, any ambanymbany any
  //     const dt: any[] = orderedData.map((element) => {
  //       return fromLonLat([element.longitude, element.latitude]);
  //     });
  //     // Opacity for first point = 0.7 and for end of traject  = 1
  //     let d: number = 0;
  //     let opacity: number = 1;
  //     const orderedDataLength: number = orderedData.length - 1;
  //     orderedData.map((element) => {
  //       if (d === 0) {
  //         opacity = 0.7;
  //       } else {
  //         opacity = 1;
  //       }
  //       // Each points of map
  //       let feat: Feature = new Feature({
  //         type: 'icon',
  //         geometry: new Point(
  //           fromLonLat([element.longitude, element.latitude])
  //         ),
  //       });
  //       feat.set('imei', localImei[i]);
  //       feat.setStyle(
  //         new Style({
  //           image: new Icon({
  //             // color: JSON.parse(element.device.color),
  //             crossOrigin: 'anonymous',
  //             src: 'assets/dot.png',
  //             size: [20, 20],
  //             opacity: opacity,
  //           }),
  //           text: new Text({
  //             textBaseline: 'bottom',
  //             offsetY: -15,
  //             font: '12px Calibri,sans-serif',
  //             fill: new Fill({ color: '#000' }),
  //             stroke: new Stroke({
  //               color: '#fff',
  //               width: 4,
  //             }),
  //             text: '',
  //             // 'Date: ' +
  //             // this.formatTime(new Date(element.date).getDate()) +
  //             // '/' +
  //             // this.formatTime(new Date(element.date).getMonth()) +
  //             // '/' +
  //             // new Date(element.date).getFullYear() +
  //             // 'T' +
  //             // this.formatTime(new Date(element.date).getHours()) +
  //             // ':' +
  //             // this.formatTime(new Date(element.date).getMinutes()) +
  //             // ':' +
  //             // this.formatTime(new Date(element.date).getSeconds()),
  //           }),
  //         })
  //       );
  //       if (d === orderedDataLength) {
  //         this.endFeature.push(feat);
  //       }
  //       d++;
  //       segment.push(feat);
  //     });

  //     let distance: number = 0;
  //     for (let j = 0; j < orderedData.length - 1; j++) {
  //       distance += getDistance(
  //         [orderedData[j].longitude, orderedData[j].latitude],
  //         [orderedData[j + 1].longitude, orderedData[j + 1].latitude]
  //       );
  //     }
  //     const time: number =
  //       (new Date(orderedData[orderedData.length - 1].date).getTime() -
  //         new Date(orderedData[0].date).getTime()) /
  //       (1000 * 3600);
  //     let vitesse: number = 0;
  //     if (time === 0) {
  //       vitesse = 0;
  //       distance = 0;
  //     } else {
  //       distance /= 1000;
  //       vitesse = distance / time;
  //       vitesse = Math.round(vitesse);
  //       distance = Math.round(distance);
  //     }

  //     let segmReturn = new Feature({
  //       geometry: new LineString(dt),
  //     });
  //     // segmReturn.set('imei', localImei[i]);
  //     // style of segments and push it
  //     segmReturn.setStyle(
  //       new Style({
  //         stroke: new Stroke({
  //           color: '#d12710',
  //           width: 2,
  //         }),
  //         text: new Text({
  //           font: '12px Calibri,sans-serif',
  //           fill: new Fill({ color: '#000' }),
  //           stroke: new Stroke({
  //             color: '#fff',
  //             width: 4,
  //           }),
  //           // text: 'Distance: ' + distance + 'km Vitesse: ' + vitesse + 'km/h',
  //           text: '',
  //         }),
  //       })
  //     );
  //     segment.push(segmReturn);
  //   }
  //   return segment;
  // }

  mapFunction(segments: Feature[]) {
    // add feature to the vector source
    this.vectorSource.addFeatures([...segments]);
  }

  flash(features: Feature[]) {
    const start = Date.now();

    let flashGeom: any[] = features.map((element) => {
      return element.getGeometry()!.clone();
    });
    const listenerKey = this.tileLayer.on('postrender', (event) => {
      const frameState = event.frameState;
      const elapsed = frameState!.time - start;
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

  @HostListener('wheel', ['$event'])
  onScroll(event: Event) {
    this.scroll = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.flash(this.endFeature);
      this.scroll = false;
    }, 300);
  }
}
