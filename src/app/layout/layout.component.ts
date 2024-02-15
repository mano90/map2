import {
  AfterContentChecked,
  AfterContentInit,
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
import { Time } from '@angular/common';
import { Geometry, Polygon } from 'ol/geom';
import { Draw, defaults as defaultInteractions } from 'ol/interaction';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Locate } from '../classes/Locate';
import { CoordinateFormatterService } from '../services/coordinate-formatter.service';
import { RtaService } from '../components/rta/rta.service';
import { ApicallService } from '../services/requests/apicall.service';
import { BehaviorSubject } from 'rxjs';
import { createBox } from 'ol/interaction/Draw';
import { NotificationService } from '../services/notification/notification.service';

const DATES: string[] = ['2022-02-02', '2022-02-03'];
const IMEIS: string[] = ['751345975112', '891144473251'];

@Component({
  selector: 'app-root',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  @ViewChild('content') content: ElementRef;
  currentCoordinates: number[];
  drawId: number;
  map: Map;
  showData = new BehaviorSubject<{ data: Locate[]; showSegment: boolean }>({
    data: [],
    showSegment: false,
  });
  activeDetails: boolean = false;
  vectorSource: VectorSource = new VectorSource();
  vectorLayer: VectorLayer<any> = new VectorLayer();
  dates: string[] = DATES;
  ids: string[] = IMEIS;
  previousData: { data: Locate[]; showSegment: boolean };
  selectedDate: string = 'All';
  selectedId: string = 'All';

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
  contentPopup: HTMLElement | null = null;
  lastDraw: Feature<Geometry>;
  currentDraw: Feature<Polygon>;
  draw: Draw;
  constructor(
    private coordinateFormatterService: CoordinateFormatterService,
    private _rta: RtaService,
    public modal: NgbModal,
    private spinner: NgxSpinnerService,
    private service: ApicallService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.contentPopup = document.getElementById('popup-content');
    // this.spinner.show();

    const container = document.getElementById('popup');
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
        this.hereLayer,
        new VectorLayer({
          source: this.vectorSource,
        }),
      ],
      overlays: [this.overlay],
    });

    this.draw = new Draw({
      source: this.vectorSource,
      type: 'Circle',
      geometryFunction: createBox(),
    });

    this.draw.on('drawstart', () => {
      this.vectorSource.removeFeature(this.lastDraw);
      this.lastDraw = null;
    });

    this.draw.on('drawend', (event) => {
      const drawnFeature = event.feature;
      drawnFeature.setStyle(
        new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.9)',
          }),
          zIndex: 999,
        })
      );
      const drawnGeometry = drawnFeature.getGeometry() as Polygon;
      const properties = drawnGeometry.getFlatCoordinates();
      this.lastDraw = drawnFeature;
      this.currentCoordinates = properties;
      this.map.removeInteraction(this.draw);
    });

    this.showData.subscribe((res) => {
      this.spinner.show();
      this.pasteData(res.data, res.showSegment);
      this.map.on('click', (event) => {
        const feature = this.map.forEachFeatureAtPixel(
          event.pixel,
          function (feature) {
            return feature;
          }
        );

        if (
          feature &&
          feature.getGeometry().getType() == 'Point' &&
          feature.getProperties()['id']
        ) {
          this.contentPopup!.innerHTML = '';
          const id = feature.getProperties()['id'];
          this.generatePopupContent(id).map((item) =>
            this.contentPopup!.append(item)
          );
          const coordinate = event.coordinate;
          this.overlay.setPosition(coordinate);
        } else {
          if (
            feature &&
            feature.getGeometry().getType() == 'Polygon' &&
            feature.getProperties()['id']
          ) {
            this.contentPopup!.innerHTML = '';
            const id = feature.getProperties()['id'];
            this.contentPopup!.append(this.generateSquareContent(id));
            const coordinate = event.coordinate;
            this.overlay.setPosition(coordinate);
          } else this.overlay.setPosition(undefined);
        }
      });
      this.spinner.hide();
    });
    this.service.getAllDevices().subscribe((res) => {
      this.previousData = this.showData.getValue();
      this.showData.next({ data: res, showSegment: false });
    });
  }

  getSpecifiedData(id: number) {
    this.service.getOneById(id).subscribe((res) => {
      this.previousData = this.showData.getValue();
      this.showData.next({ data: res, showSegment: true });
    });
  }

  getDelimitations(id: number) {
    this.service.getDeviceById(id).subscribe((res) => {
      const data: number[][] = [];
      data.push(res.limiteHG.split(',').map((e) => +e));
      data.push(res.limiteHD.split(',').map((e) => +e));
      data.push(res.limiteBD.split(',').map((e) => +e));
      data.push(res.limiteBG.split(',').map((e) => +e));
      data.push(res.limiteHG.split(',').map((e) => +e));
      this.formatCoordinates(data, id);
    });
  }

  getAllData() {
    this.service.getAllDevices().subscribe((res) => {
      this.pasteData(res);
      this.map.on('click', (event) => {
        const feature = this.map.forEachFeatureAtPixel(
          event.pixel,
          function (feature) {
            return feature;
          }
        );
        if (feature) {
          this.contentPopup!.innerHTML = '';
          const id = feature.getProperties()['id'];
          this.generatePopupContent(id).map((item) =>
            this.contentPopup!.append(item)
          );
          const coordinate = event.coordinate;
          this.overlay.setPosition(coordinate);
        } else {
          this.overlay.setPosition(undefined);
        }
      });
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

  //     const filtredId: number[] = da.msg.map((item) => {
  //       return item.after.id;
  //     });
  //     console.log(filtredId);
  //     this._rta.getItemsById(filtredId).subscribe((res: Locate[]) => {
  //       // console.log(res);
  //       this.allLocates.push(...res);
  //       this.pasteData();
  //     });
  //   });
  generateSquareContent(id: string): HTMLElement {
    const deplacement = this.formatButton(document.createElement('button'));
    deplacement.innerHTML = 'Changer';
    deplacement.addEventListener('click', () => {
      this.map.addInteraction(this.draw);
      this.drawId = +id;

      this.overlay.setPosition(undefined);
    });
    return deplacement;
  }
  generatePopupContent(id: string): HTMLElement[] {
    const deplacement = this.formatButton(document.createElement('button'));
    deplacement.innerHTML = 'Historique';
    deplacement.addEventListener('click', () => {
      this.getDeplacements(id);
      this.overlay.setPosition(undefined);
    });
    const maintenance = this.formatButton(document.createElement('button'));
    maintenance.innerHTML = 'Maintenance';
    maintenance.addEventListener('click', () => {
      this.getMaintenances(id);
      this.overlay.setPosition(undefined);
    });
    const settings = this.formatButton(document.createElement('button'));
    settings.innerHTML = 'Délimitations';
    settings.addEventListener('click', () => {
      this.getDelimitations(+id);
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
  getDeplacements(id: string) {
    this.activeDetails = true;
    this.getSpecifiedData(+id);
  }
  getMaintenances(id: string) {
    console.log('get maintenances', id);
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }

  pasteData(locate: Locate[], setSegment: boolean = false) {
    const date: string = this.selectedDate;
    const id: string = this.selectedId;
    let newArray: Locate[] = locate;
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

    if (this.selectedId !== 'All') {
      newArray = newArray.filter((item) => {
        return item.device.id == +id;
      });
    }
    this.vectorSource.clear();
    this.mapFunction(this.getPoints(newArray));
    if (setSegment) this.mapFunction(this.getSegments(newArray));
  }

  changeDate(event: any) {
    this.selectedDate = event.target.value;
  }
  changeTelephone(event: any) {
    this.selectedId = event.target.value;
  }

  getPoints(features: Locate[]): Feature[] {
    const points: Feature[] = [];
    for (let feature of features) {
      let feat: Feature = new Feature({
        type: 'icon',
        geometry: new Point(fromLonLat([feature.longitude, feature.latitude])),
      });
      feat.set('id', feature.device.id);
      feat.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: `http://localhost:3000/images/${feature.device.icon}`,
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

  getSegments(da: Locate[]): Feature[] {
    this.endFeature = [];
    let segment: Feature[] = [];
    let localId: number[] = da.map((element) => {
      return element.device.id;
    });

    const unique = (value: any, index: any, self: any) => {
      return self.indexOf(value) === index;
    };
    localId = localId.filter(unique);
    for (let i = 0; i < localId.length; i++) {
      const orderedData: Locate[] = da
        .filter((element) => {
          return element.device.id == localId[i];
        })
        .sort((a, b) => {
          const da = new Date(a.date);
          const db = new Date(b.date);
          if (da < db) return -1;
          if (da > db) return 1;
          return 1;
        });
      const dt: any[] = orderedData.map((element) => {
        return fromLonLat([element.longitude, element.latitude]);
      });
      let d: number = 0;
      const orderedDataLength: number = orderedData.length - 1;
      orderedData.map((element) => {
        let feat: Feature = new Feature({
          type: 'icon',
          geometry: new Point(
            fromLonLat([element.longitude, element.latitude])
          ),
        });
        feat.set('id', localId[i]);
        feat.setStyle(
          new Style({
            text: new Text({
              textBaseline: 'bottom',
              offsetY: -15,
              font: '12px Calibri,sans-serif',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({
                color: '#fff',
                width: 4,
              }),
              text:
                'Date: ' +
                this.formatTime(new Date(element.date).getDate()) +
                '/' +
                this.formatTime(new Date(element.date).getMonth() + 1) +
                '/' +
                new Date(element.date).getFullYear() +
                'T' +
                this.formatTime(new Date(element.date).getHours()) +
                ':' +
                this.formatTime(new Date(element.date).getMinutes()) +
                ':' +
                this.formatTime(new Date(element.date).getSeconds()),
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
      for (let j = 0; j < orderedData.length - 1; j++) {
        distance += getDistance(
          [orderedData[j].longitude, orderedData[j].latitude],
          [orderedData[j + 1].longitude, orderedData[j + 1].latitude]
        );
      }
      const time: number =
        (new Date(orderedData[orderedData.length - 1].date).getTime() -
          new Date(orderedData[0].date).getTime()) /
        (1000 * 3600);
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
        geometry: new LineString(dt),
      });
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
            text: '',
          }),
        })
      );
      segment.push(segmReturn);
    }
    return segment;
  }

  mapFunction(segments: Feature[]) {
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
      this.map.render();
    });
  }

  formatTime(nombre: number): string {
    if (nombre < 10) {
      return '0' + nombre;
    }
    return nombre.toString();
  }
  initialData() {
    this.activeDetails = false;
    this.endFeature = [];
    this.showData.next(this.previousData);
  }

  switchOpenLayers() {
    this.tileLayer.setVisible(true);
    this.hereLayer.setVisible(false);
  }

  switchHereLayer() {
    this.tileLayer.setVisible(false);
    this.hereLayer.setVisible(true);
  }
  formatCoordinates(data: number[][], id: number) {
    const square = new Feature({
      geometry: new Polygon([data]),
    });
    square.set('id', id);
    square.setStyle(
      new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0.9)',
        }),
        zIndex: 999,
      })
    );
    this.currentDraw = square;

    this.mapFunction([square]);
  }

  private formatToCoordinate(data: number[]) {
    return {
      limiteHG: data[0] + ',' + data[1],
      limiteHD: data[2] + ',' + data[3],
      limiteBD: data[4] + ',' + data[5],
      limiteBG: data[6] + ',' + data[7],
    };
  }
  saveCoordinates() {
    this.vectorSource.removeFeature(this.currentDraw);
    this.vectorSource.removeFeature(this.lastDraw);
    this.lastDraw = null;
    this.map.removeInteraction(this.draw);
    const formatedCoordinates = this.formatToCoordinate(
      this.currentCoordinates
    );
    const id = this.drawId;
    this.service
      .updateCoordinates(
        id,
        formatedCoordinates.limiteHG,
        formatedCoordinates.limiteHD,
        formatedCoordinates.limiteBD,
        formatedCoordinates.limiteBG
      )
      .subscribe(() => {
        this.notificationService.autoClose('success', 'Modification effectuée');
      });
    this.drawId = null;
  }

  cancelCoordinates() {
    this.vectorSource.removeFeature(this.currentDraw);
    this.vectorSource.removeFeature(this.lastDraw);
    this.lastDraw = null;
    this.map.removeInteraction(this.draw);
    this.drawId = null;
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
