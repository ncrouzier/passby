import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-gpx';
import 'leaflet-geometryutil'
import * as d3 from "d3";
import { RouteService } from '../route.service';
import { MapService } from '../map.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


delete L.Icon.Default.prototype._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/dist/images/marker-icon.png'),
//   shadowUrl: require('leaflet/dist/images/marker-shadow.png')
// });

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})



export class MapComponent implements OnInit {
  // @ViewChild('inputFile') myInputVariable: ElementRef;


  public map;
  public startTime = new Date();
  public endTime = new Date();
  // public layerGrp;
  // private svg;

  private polyline = []

  unsubscribe$: Subject<boolean> = new Subject();

  @Output() messageEvent = new EventEmitter<any>();

  // openFile() {
  //   document.querySelector('input').click()
  // }

  infos() {
    let that = this;
    console.time('createSynchedData')
    this.routeService.createSynchedData()
    console.timeEnd('createSynchedData')
  }



  removeLayerMap(route) {
    if (route !== null) {
      if (route.getMarker() !== null) {
        this.map.removeLayer(route.getMarker())
      }
      this.map.removeLayer(route.getRouteData());
    }
  }


  private initMap(): void {

    this.map = L.map('map', {
      center: [39.1282, -77.1795],
      zoom: 12,
      zoomControl: false
    });
    this.mapService.setMap(this.map)

    // this.layerGrp = new L.layerGroup();
    // this.polyline = L.polyline([], { color: 'red' }).addTo(this.map);

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  updateMarker(markerInfo: any) {
    if (markerInfo.latLng !== undefined && markerInfo.marker !== undefined && markerInfo.latLng !== null) {// && markerInfo.marker._latlng !== undefined && (markerInfo.marker._latlng.lat !== 0 && markerInfo.marker._latlng.lng !== 0)) {
      if (!this.map.hasLayer(markerInfo.marker)) {
        markerInfo.marker.addTo(this.map);
      }
      markerInfo.marker.setLatLng(markerInfo.latLng)
    } else {
      this.map.removeLayer(markerInfo.marker)
    }

  }

  updatePoly(poly: any) {
    if (poly !== undefined && poly != null) { //&& markerInfo.latLng.meta.placeholder !== true) {
      let i
      for (i = 0; i < poly.length; i++) {
        if (poly[i] !== undefined) {
          if (this.polyline[i] === undefined) {
            this.polyline[i] = L.polyline([], { color: 'red' }).addTo(this.map);
          }
          this.polyline[i].setLatLngs(poly[i])
        }
      }

    }

  }



  constructor(private routeService: RouteService, private mapService: MapService) { }

  ngOnInit() {
    this.initMap();
    // this.routeService.getRoutesObs().pipe(takeUntil(this.unsubscribe$)).subscribe(routes => { this.layerGrp = routes; this.updateMap(); console.log("coucou Map") }, (err) => console.error(err), () => { console.log("observable complete"); });
    this.routeService.getDeletedRouteObs().pipe(takeUntil(this.unsubscribe$)).subscribe(route => { this.removeLayerMap(route); });
    this.routeService.getMarkerObs().pipe(takeUntil(this.unsubscribe$)).subscribe(markerInfo => { if (markerInfo !== null) this.updateMarker(markerInfo); });
    this.routeService.getPolyObs().pipe(takeUntil(this.unsubscribe$)).subscribe(poly => { this.updatePoly(poly); });
  }


}
