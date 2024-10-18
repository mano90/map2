import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Map as OlMap } from 'ol';
import View from 'ol/View';
import VectorSource from 'ol/source/Vector';
import Overlay from 'ol/Overlay';

import { unByKey } from 'ol/Observable';
import { getVectorContext } from 'ol/render';
import Polyline from 'ol/format/Polyline';
import Feature, { FeatureLike } from 'ol/Feature';
import { fromLonLat, transform } from 'ol/proj.js';
import { Tile, Vector as VectorLayer } from 'ol/layer';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { easeOut } from 'ol/easing';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { getDistance } from 'ol/sphere';
import { Geometry, Polygon } from 'ol/geom';
import { Draw, defaults as defaultInteractions } from 'ol/interaction';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Locate } from '../classes/Locate';
import { CoordinateFormatterService } from '../services/coordinate-formatter.service';
import { RtaService } from '../components/rta/rta.service';
import { ApicallService } from '../services/requests/apicall.service';
import { BehaviorSubject, filter } from 'rxjs';
import { createBox } from 'ol/interaction/Draw';
import { NotificationService } from '../services/notification/notification.service';
import { BackgroundMapService } from '../services/map/background-map.service';
import { Coordinate } from 'ol/coordinate';
import { Socket } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { DeviceColorBlinking } from '../classes/DeviceColorBlinking';
import { Device, FeatureToBlink } from '../classes/Device';

const a = fromLonLat([43.5, -25.6]);
const b = fromLonLat([50.5, -12.0]);
const madagascarExtent = [...a, ...b];
@Component({
  selector: 'app-root',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  begin: Date;
  end: Date;

  featuresToBlink: FeatureToBlink[] = [];

  receiveMessage($event: any) {
    this.clearAllIntervals();
    this.previousData = this.showData.getValue();
    this.showData.next({ data: $event.data, showSegment: false });
    this.begin = $event.begin;
    this.end = $event.end;
  }
  userLocation: [number, number];
  @ViewChild('content') content: ElementRef;
  currentCoordinates: number[];
  drawId: number;
  map: OlMap;
  showData = new BehaviorSubject<{ data: Locate[]; showSegment: boolean }>({
    data: [],
    showSegment: false,
  });
  activeDetails: boolean = false;
  vectorSource: VectorSource = new VectorSource();
  vectorLayer: VectorLayer<any> = new VectorLayer();
  previousData: { data: Locate[]; showSegment: boolean };
  duration: number = 3000;
  scroll = false;
  timeout: any;
  endFeature: Feature[] = [];
  overlay: Overlay;
  contentPopup: HTMLElement | null = null;
  lastDraw: Feature<Geometry>;
  currentDraw: Feature<Polygon>;
  draw: Draw;
  backgroundLayers: any[];

  private flashIntervals: Map<string, any> = new Map();
  constructor(
    private coordinateFormatterService: CoordinateFormatterService,
    private _rta: RtaService,
    public modal: NgbModal,
    private spinner: NgxSpinnerService,
    private service: ApicallService,
    private notificationService: NotificationService,
    private backgroundMapService: BackgroundMapService,
    private socket: Socket
  ) {}

  sendMessage(message: string) {
    this.socket.emit('message', message);
  }

  reInitMap() {
    window.location.reload();
  }

  ngOnInit(): void {
    this.socket.connect();
    this.socket.on('alert', (data: any) => {
      console.log('reloaded');
      this.getAllData();
    });
    this.backgroundLayers = this.backgroundMapService.getBackgroundLayers();

    this.contentPopup = document.getElementById('popup-content');

    const container = document.getElementById('popup');
    this.overlay = new Overlay({
      element: container!,
      autoPan: true,
    });
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: new Style({
        stroke: new Stroke({
          width: 4,
          color: 'red',
        }),
      }),
    });
    this.map = new OlMap({
      view: new View({
        projection: 'EPSG:3857',
        center: [5447146.549216399, -2173252.1023832164],
        zoom: 6,
        minZoom: 6,
        maxZoom: 18,
        extent: madagascarExtent,
        constrainOnlyCenter: true,
      }),
      interactions: defaultInteractions({
        doubleClickZoom: false,
      }),
      layers: [this.backgroundLayers[0].layer],
      overlays: [this.overlay],
    });

    this.map.addLayer(this.vectorLayer);

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

    this.getAllData();
    this.showData.subscribe((res) => {
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
          this.generatePopupContent(id, feature).map((item) =>
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
    });
  }
  addMovingMarker(points: number[][]): void {
    const line = new LineString(points.map((item) => item));
    const markerStyle = new Style({
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
      }),
    });

    const marker = new Feature({
      type: 'icon',
      geometry: new Point(fromLonLat(points[0])),
    });
    marker.setStyle(markerStyle);

    this.vectorSource.addFeature(marker);

    let i = 0;
    const steps = 150;
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

  getAllData() {
    this.spinner.show();
    this.service.getAllDevices().subscribe({
      next: (res) => {
        this.previousData = this.showData.getValue();
        this.showData.next({ data: res, showSegment: false });
      },
      complete: () => {
        this.spinner.hide();
      },
    });
  }
  updateBackgroundLayer(newLayer: any) {
    this.map.getLayers().setAt(0, newLayer.layer);
  }
  getSpecifiedData(id: number) {
    this.service.getOneById(id, this.end, this.begin).subscribe((res) => {
      this.previousData = this.showData.getValue();
      this.showData.next({ data: res, showSegment: true });
    });
  }

  getDelimitations(id: number) {
    this.removeSquares();
    this.service.getDeviceById(id).subscribe((res) => {
      const data: number[][] = [];
      const limitesHG = res.limiteHG.split(',').map((e) => +e);
      const limitesBD = res.limiteBD.split(',').map((e) => +e);
      data.push(fromLonLat(limitesHG));
      data.push(fromLonLat([limitesBD[0], limitesHG[1]]));
      data.push(fromLonLat(limitesBD));
      data.push(fromLonLat([limitesHG[0], limitesBD[1]]));
      data.push(fromLonLat(limitesHG));
      this.formatCoordinates(data, id);
    });
  }

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
  generatePopupContent(id: string, feature: FeatureLike): HTMLElement[] {
    const deplacement = this.formatButton(document.createElement('button'));
    deplacement.innerHTML = 'Historique';
    deplacement.addEventListener('click', () => {
      this.clearAllIntervals();
      this.getDeplacements(id);
      this.overlay.setPosition(undefined);
    });

    const maintenance = this.formatButton(document.createElement('button'));
    maintenance.innerHTML = 'Trajet';
    maintenance.addEventListener('click', () => {
      if (!this.currentCoordinates)
        this.getLocation().then(() => {
          this.getTraject(id, feature);
        });
      else this.getTraject(id, feature);
      this.overlay.setPosition(undefined);
    });

    const settings = this.formatButton(document.createElement('button'));
    settings.innerHTML = 'Délimitations';
    settings.addEventListener('click', () => {
      this.getDelimitations(+id);
      this.overlay.setPosition(undefined);
    });

    const alertButtonContainer = document.createElement('div');

    if (feature.getProperties()['alertType']) {
      const alertType = feature.getProperties()['alertType'];

      if (alertType.credit) {
        const creditAlertButton = this.formatButton(
          document.createElement('button')
        );
        creditAlertButton.innerHTML = 'Stop Credit Alert';
        creditAlertButton.addEventListener('click', () => {
          this.service
            .sendStopAlertMessage(feature.getProperties()['deviceNumber'], 'C')
            .subscribe();
          this.notificationService.info('Mise à jour en cours');
          this.overlay.setPosition(undefined);

          setTimeout(() => {
            window.location.reload();
          }, 2500);
        });
        alertButtonContainer.appendChild(creditAlertButton);
      }

      if (alertType.limites) {
        const limitesAlertButton = this.formatButton(
          document.createElement('button')
        );
        limitesAlertButton.innerHTML = 'Stop Limites Alert';
        limitesAlertButton.addEventListener('click', () => {
          this.service
            .sendStopAlertMessage(feature.getProperties()['deviceNumber'], 'L')
            .subscribe();
          this.notificationService.info('Mise à jour en cours');
          this.overlay.setPosition(undefined);
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        });
        alertButtonContainer.appendChild(limitesAlertButton);
      }

      if (alertType.seuil) {
        const seuilAlertButton = this.formatButton(
          document.createElement('button')
        );
        seuilAlertButton.innerHTML = 'Stop Seuil Alert';
        seuilAlertButton.addEventListener('click', () => {
          this.service
            .sendStopAlertMessage(feature.getProperties()['deviceNumber'], 'T')
            .subscribe();
          this.notificationService.info('Mise à jour en cours');
          this.overlay.setPosition(undefined);
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        });
        alertButtonContainer.appendChild(seuilAlertButton);
      }
    }

    const deplacementContainer = document.createElement('div');
    const maintenanceContainer = document.createElement('div');
    const settingsContainer = document.createElement('div');

    deplacementContainer.style.paddingBottom = '2px';
    maintenanceContainer.style.paddingBottom = '2px';

    deplacementContainer.append(deplacement);
    maintenanceContainer.append(maintenance);
    settingsContainer.append(settings);

    return [
      deplacementContainer,
      maintenanceContainer,
      settingsContainer,
      alertButtonContainer,
    ];
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
  getTraject(id: string, feature: FeatureLike) {
    this.vectorSource.forEachFeature((feature) => {
      if (feature.getGeometry().getType() === 'LineString') {
        this.vectorSource.removeFeature(feature);
      }
    });
    const data = feature.getGeometry() as Point;
    const coordinates = data.getFlatCoordinates();
    const formatedCoordinates: [number, number] = [
      coordinates[0],
      coordinates[1],
    ];
    const f1: Coordinate = transform(
      this.userLocation,
      'EPSG:3857',
      'EPSG:4326'
    );
    const f2: Coordinate = transform(
      formatedCoordinates,
      'EPSG:3857',
      'EPSG:4326'
    );
    this.service
      .getRoute(
        [
          [f1[0], f1[1]],
          [f2[0], f2[1]],
        ],
        'route',
        'foot'
      )
      .subscribe((result: any) => {
        const polyline = result.routes[0].geometry;
        const route = new Polyline({
          factor: 1e6,
        }).readGeometry(polyline, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });
        const routeFeature = new Feature({
          type: 'route',
          geometry: route,
        });
        this.vectorLayer.getSource().addFeature(routeFeature);
        const extent = routeFeature.getGeometry().getExtent();
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 18,
          duration: 1000,
        });
      });
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }

  pasteData(locate: Locate[], setSegment: boolean = false) {
    let newArray: Locate[] = locate;

    this.vectorSource.clear();
    this.mapFunction(this.getPoints(newArray));
    if (this.featuresToBlink) this.flashMultiple(this.featuresToBlink);
    if (setSegment) this.mapFunction(this.getSegments(newArray));
  }

  getPoints(features: Locate[]): Feature[] {
    const points: Feature[] = [];
    for (let featureData of features) {
      let feat: Feature = new Feature({
        type: 'icon',
        geometry: new Point(
          fromLonLat([featureData.longitude, featureData.latitude])
        ),
      });
      feat.set('id', featureData.device.id);

      let alertType: any = {};

      if (featureData.device.blinkCredit) {
        this.featuresToBlink.push({
          deviceColorBlinking: DeviceColorBlinking.BLINKCREDIT,
          featureId: String(featureData.device.id),
        });
        alertType.credit = true;
      }

      if (featureData.device.blinkLimites) {
        alertType.limites = true;
        this.featuresToBlink.push({
          deviceColorBlinking: DeviceColorBlinking.BLINKLIMITES,
          featureId: String(featureData.device.id),
        });
      }

      if (featureData.device.blinkSeuil) {
        alertType.seuil = true;
        this.featuresToBlink.push({
          deviceColorBlinking: DeviceColorBlinking.BLINKSEUIL,
          featureId: String(featureData.device.id),
        });
      }

      if (Object.keys(alertType).length > 0) {
        feat.setProperties({
          alertType: alertType,
        });
      }

      feat.setProperties({
        deviceNumber: featureData.device.deviceNumber,
      });

      feat.setStyle(
        new Style({
          image: new Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: `${environment.imageStaticUrl}${featureData.device.icon}`,
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
      const element = document.createElement('div');
      element.className = 'flashing'; // Apply the CSS flashing class

      // Optionally, set the size of the flashing element
      element.style.width = '20px';
      element.style.height = '20px';
      element.style.borderRadius = '50%';

      // Create an Overlay and attach the element to the map at the feature's position
      const overlay = new Overlay({
        position: fromLonLat([featureData.longitude, featureData.latitude]),
        positioning: 'center-center',
        element: element,
        stopEvent: false,
      });

      // this.map.addOverlay(overlay);
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
          feat.set('last', true);
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
    const t = segment.slice(0, -1);
    this.addMovingMarker(
      t.map((item) => {
        const drawnGeometry = item.getGeometry() as LineString;
        const properties = drawnGeometry.getFlatCoordinates();
        return [properties[0], properties[1]];
      })
    );
    return segment;
  }

  mapFunction(segments: Feature[]) {
    this.vectorSource.addFeatures(segments);
  }

  flashMultiple(deviceColorBlinkings: FeatureToBlink[]) {
    deviceColorBlinkings.forEach((deviceItem) => {
      this.flashOne(deviceItem.featureId, deviceItem.deviceColorBlinking);
    });
  }

  flashOne(
    featureId: string,
    color: string = '255,255,0',
    intervalDuration: number = 1000
  ) {
    const feature = this.getFeatureById(featureId);
    if (feature) {
      if (this.flashIntervals.has(featureId)) {
        const currentDataInterval = this.flashIntervals.get(featureId);
        const colorList: string[] = currentDataInterval.color;
        if (colorList.includes(color)) return;
        colorList.push(color);
        let currentIndex = 0;
        let flashGeom: Geometry = feature.getGeometry()!.clone();
        const intervalId = setInterval(() => {
          const currentColor = colorList[currentIndex];
          this.map.getLayers().forEach((item) => {
            this.applyPostrender(item, flashGeom, currentColor);
          });
          currentIndex = (currentIndex + 1) % colorList.length;
        }, intervalDuration);
        clearInterval(currentDataInterval.intervalId);
        this.flashIntervals.set(featureId, { intervalId, color: colorList });
      } else {
        const colorList = [color];
        let currentIndex = 0;
        let flashGeom: Geometry = feature.getGeometry()!.clone();
        const intervalId = setInterval(() => {
          const currentColor = colorList[currentIndex];
          this.map.getLayers().forEach((item) => {
            this.applyPostrender(item, flashGeom, currentColor);
          });

          currentIndex = (currentIndex + 1) % colorList.length;
        }, intervalDuration);

        this.flashIntervals.set(featureId, { intervalId, color: colorList });
      }
    }
  }

  restartFlashing(
    featureId: string,
    colorList: string[],
    currentIntervalId: any
  ) {
    clearInterval(currentIntervalId);

    let currentIndex = 0;
    const feature = this.getFeatureById(featureId);

    let flashGeom: Geometry = feature.getGeometry()!.clone();

    if (feature) {
      const newIntervalId = setInterval(() => {
        const currentColor = colorList[currentIndex];
        this.map.getLayers().forEach((item) => {
          this.applyPostrender(item, flashGeom, currentColor);
        });
        currentIndex = (currentIndex + 1) % colorList.length;
      }, 1000);
      this.flashIntervals.set(String(featureId), {
        intervalId: newIntervalId,
        color: colorList,
      });
    }
  }

  private clearAllIntervals(): void {
    this.flashIntervals.forEach((intervalData, featureId) => {
      clearInterval(intervalData.intervalId);
    });

    this.flashIntervals.clear();
  }

  private applyPostrender(
    layer: any,
    flashGeom: Geometry,
    color: string = '255,255,0'
  ) {
    if (layer instanceof Tile) {
      const start = Date.now();

      const listenerKey = layer.on('postrender', (event) => {
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
              color: `rgba(${color}, ${opacity})`,
              width: 0.25 + opacity,
            }),
          }),
        });
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(flashGeom);

        this.map.render();
      });

      this.map.render();
    }
  }

  formatTime(nombre: number): string {
    if (nombre < 10) {
      return '0' + nombre;
    }
    return nombre.toString();
  }
  initialData() {
    this.begin = null;
    this.end = null;
    this.removeSquares();
    this.activeDetails = false;
    this.endFeature = [];
    this.getAllData();
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
      limiteHG: transform([data[0], data[1]], 'EPSG:3857', 'EPSG:4326').join(
        ','
      ),
      limiteHD: transform([data[2], data[3]], 'EPSG:3857', 'EPSG:4326').join(
        ','
      ),
      limiteBD: transform([data[4], data[5]], 'EPSG:3857', 'EPSG:4326').join(
        ','
      ),
      limiteBG: transform([data[6], data[7]], 'EPSG:3857', 'EPSG:4326').join(
        ','
      ),
    };
  }

  private removeSquares() {
    this.vectorSource.removeFeature(this.currentDraw);
    this.vectorSource.removeFeature(this.lastDraw);
    this.lastDraw = null;
    this.currentDraw = null;
  }
  saveCoordinates() {
    this.removeSquares();
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
        formatedCoordinates.limiteBD
      )
      .subscribe(() => {
        this.notificationService.autoClose('success', 'Modification effectuée');
      });
    this.drawId = null;
  }

  cancelCoordinates() {
    this.removeSquares();
    this.lastDraw = null;
    this.map.removeInteraction(this.draw);
    this.drawId = null;
  }

  getLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        reject("Vous avez besoin d'accorder la permission");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;

          const t = [longitude, latitude];

          const webMercator = transform(t, 'EPSG:4326', 'EPSG:3857');

          this.userLocation = [webMercator[0], webMercator[1]];
          const feature = new Feature({
            geometry: new Point(this.userLocation),
          });
          feature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                scale: [0.09, 0.09],
                opacity: 1,
                src: `${environment.imageStaticUrl}202402131343307751.png`,
              }),
            })
          );
          this.mapFunction([feature]);
          return resolve(null);
        });
      }
    });
  }

  getFeatureById(id: string): Feature | null {
    let foundFeature: Feature | null = null;

    this.vectorSource.forEachFeature((feature) => {
      if (feature.get('id') == id) {
        foundFeature = feature;
      }
    });
    return foundFeature;
  }
  ngOnDestroy(): void {
    this.clearAllIntervals();
  }
}
