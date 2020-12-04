import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-gpx';
import 'leaflet-geometryutil'
import 'leaflet-distance-markers'
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
  public layerGrp;
  private svg;
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
      if (route.marker !== null) {
        this.map.removeLayer(route.marker)
      }
      this.map.removeLayer(route);
    }
  }

  // handle(e) {
  //   let that = this;
  //
  //   var fileReader = new FileReader();
  //   [...e.target.files].forEach(file => {
  //     var fileReader = new FileReader();
  //     var color = "#" + Math.floor(Math.random() * (1 << 3 * 8)).toString(16).padStart(6, "0")
  //     fileReader.onload = (e) => {
  //       var gpx = fileReader.result
  //       var layer = new L.GPX(gpx, {
  //         async: true,
  //         polyline_options: {
  //           color: color,
  //           fillOpacity: 1
  //           // ,distanceMarkers: { offset: 1609.34 }
  //         },
  //         marker_options: {
  //           startIconUrl: null,
  //           endIconUrl: null
  //           // startIconUrl: '/assets/images/pin-icon-start.png',
  //           // endIconUrl: '/assets/images/pin-icon-end.png',
  //           // shadowUrl: '/assets/images/pin-shadow.png'
  //         }
  //       }).on('loaded', function(e) {
  //         that.map.fitBounds(e.target.getBounds());
  //         that.routeService.addRoute(e.target, color);
  //         that.routeService.createSynchedData()
  //       }).addTo(that.map)
  //     }
  //     fileReader.readAsText(file)
  //   });
  //   this.routeService.createSynchedData()
  //   //clear input in case we want to reload the same
  //   that.myInputVariable.nativeElement.value = '';
  // }

  private initMap(): void {

    this.map = L.map('map', {
      center: [38.8282, -79.5795],
      zoom: 7,
      zoomControl: false
    });
    this.mapService.setMap(this.map)

    this.layerGrp = new L.layerGroup();


    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  updateMarker(markerInfo: any) {
    if (markerInfo.latLng !== undefined && markerInfo.latLng.meta.placeholder !== true) {
      if (markerInfo.latLng !== undefined && markerInfo.marker !== undefined) {// && markerInfo.marker._latlng !== undefined && (markerInfo.marker._latlng.lat !== 0 && markerInfo.marker._latlng.lng !== 0)) {
        if (!this.map.hasLayer(markerInfo.marker)) {
          markerInfo.marker.addTo(this.map);
        }
        markerInfo.marker.setLatLng(markerInfo.latLng)
      }
    }
  }


  constructor(private routeService: RouteService, private mapService: MapService) { }

  ngOnInit() {
    this.initMap();
    // this.routeService.getRoutesObs().pipe(takeUntil(this.unsubscribe$)).subscribe(routes => { this.layerGrp = routes; this.updateMap(); console.log("coucou Map") }, (err) => console.error(err), () => { console.log("observable complete"); });
    this.routeService.getDeletedRouteObs().pipe(takeUntil(this.unsubscribe$)).subscribe(route => { this.removeLayerMap(route); });
    this.routeService.getMarkerObs().pipe(takeUntil(this.unsubscribe$)).subscribe(markerInfo => { if (markerInfo !== null) this.updateMarker(markerInfo); });
  }


}
