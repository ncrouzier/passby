import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../route.service';
import { MapService } from '../map.service';
import { ColorPickerService, Cmyk } from 'ngx-color-picker';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @ViewChild('inputFile') myInputVariable: ElementRef;


  public layerGrp;
  public startTime = null
  public endTime = null
  public max = 0
  public sliderValue = 1
  public referenceRoute
  public synchData

  public interval = null
  public intervalIncre
  public initialIntervalIncre = 50

  showErrorMsg = false

  unsubscribe$: Subject<boolean> = new Subject();

  @Output() messageEvent = new EventEmitter<any>();


  constructor(private routeService: RouteService, private mapService: MapService) {
  }

  openFile() {
    document.querySelector('input').click()
  }


  openGPX(ee) {
    let that = this;

    var map = this.mapService.getMap()
    var fileReader = new FileReader();

    [...ee.target.files].forEach(file => {
      var fileReader = new FileReader();
      var color = "#" + Math.floor(Math.random() * (1 << 3 * 8)).toString(16).padStart(6, "0")
      that.showErrorMsg = false
      fileReader.onload = (e) => {
        var gpx = fileReader.result
        try {
          var layer = new L.GPX(gpx, {
            async: true,
            polyline_options: {
              color: color,
              fillOpacity: 1
              // ,distanceMarkers: { offset: 1609.34 }
            },
            marker_options: {
              startIconUrl: null,
              endIconUrl: null
              // startIconUrl: '/assets/images/pin-icon-start.png',
              // endIconUrl: '/assets/images/pin-icon-end.png',
              // shadowUrl: '/assets/images/pin-shadow.png'
            },

          }).on('loaded', function(e) {
            map.fitBounds(e.target.getBounds());
            that.routeService.addRoute(e.target, color);
            that.routeService.createSynchedData()
          }).on('error', function(e) {
            console.log('Error loading file: ' + e.err);
          }).addTo(map)

        } catch (err) {
          that.showErrorMsg = true
          console.log('Error loading file: ' + err.err);
        }
      }
      fileReader.readAsText(file)
    });

    this.routeService.createSynchedData()
    //clear input in case we want to reload the same
    that.myInputVariable.nativeElement.value = '';
  }







  timeDiff(startTime, endTime) {
    var timeDiff = Math.abs(endTime.getTime() - startTime.getTime());
    return timeDiff;
  }




  formatLabel(value) {
    if (this.synchData !== undefined && this.synchData !== null && this.synchData.length !== 0 && this.synchData[value][0] !== undefined) {
      return new Date(this.synchData[value][0].meta.time).toLocaleTimeString()
    }

  }

  updateMarkers(value) {

    this.sliderValue = value;
    if (this.synchData !== undefined && this.synchData !== null && this.synchData.length !== 0) {
      var i: number
      for (i = 0; i < this.synchData[0].length; i++) {
        // console.log("update" + value + " " + this.synchData[Math.max(value, 1)][i])
        this.routeService.updateMarkerLocation(this.synchData[0][i].marker, this.synchData[Math.max(value, 1)][i])
      }
    }
  }

  updateData() {
    let that = this;

    if (this.layerGrp !== undefined && this.layerGrp !== null && this.layerGrp.getLayers().length > 0) {
      this.layerGrp.getLayers().forEach(function(route) {
        if (route._info.isReference === true) {
          that.startTime = route.get_start_time()
          that.endTime = route.get_end_time()
          that.referenceRoute = route
          //that.max = that.routeService.getRouteLatLngs(route).length
        }
      });
      //that.timeDiff(that.startTime, that.endTime);
    } else {
      that.startTime = null
      that.endTime = null
    }

  }

  colorPickerChange(route, value) {
    this.routeService.updateMarkerColor(route, value)
  }

  onEventLog(event: string, data: any): void {
    console.log(event, data);
  }


  updateSynchData() {
    let that = this

    //update position slider
    if (that.synchData !== undefined && that.synchData !== null && that.synchData.length !== 0) {
      that.max = this.synchData.length - 1 //that.routeService.getRouteLatLngs(route).length
    } else {
      that.stop()
      that.resetSlider()
    }
  }

  getReferenceRoute() {
    return this.routeService.getReferenceRoute();
  }

  resetSlider() {
    this.sliderValue = 1
    this.max = 1
    this.updateMarkers(this.sliderValue)
  }

  changeToReference(_route) {
    this.layerGrp.getLayers().forEach(function(route) {
      route._info.isReference = false
    });
    _route._info.isReference = true
    this.updateData()
    this.resetSlider()
    this.routeService.createSynchedData()

  }

  viewInfo(_route) {
    let list = this.routeService.getRouteLatLngs(_route)
    console.log(list)
  }

  changeSpeed(value) {
    var minv = Math.log(1000);
    var maxv = Math.log(1);
    // calculate adjustment factor
    var scale = (maxv - minv) / (100 - 0);

    var milli = Math.exp(minv + scale * (value - 0));
    this.intervalIncre = milli
    //if it's running, stop it and start at new rate otherwise do nothing
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null;
      this.playPause();
    }
  }

  playPause() {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null;
    } else if (this.synchData !== undefined && this.synchData !== null && this.synchData.length !== 0) {
      this.interval = setInterval(() => {
        if (this.sliderValue >= this.max) {
          this.sliderValue = 1
        } else {
          this.sliderValue++
          this.updateMarkers(this.sliderValue)
        }
      }, this.intervalIncre)
    }
  }

  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null;
    }
  }

  fw() {

  }

  bw() {

  }

  deleteRoute(route: any) {
    let that = this;
    that.routeService.deleteRoute(route)
    this.routeService.createSynchedData()
  }

  sort() {
    return this.layerGrp.getLayers().sort(function(a, b) {
      return b._info.isReference - a._info.isReference;
    });

    // return this.layerGrp.getLayers().sort((a, b) => a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1);
  }

  ngOnInit(): void {
    this.routeService.getRoutesObs().pipe(takeUntil(this.unsubscribe$)).subscribe(routes => { this.layerGrp = routes; this.updateData() });
    this.routeService.getSynchDataObs().pipe(takeUntil(this.unsubscribe$)).subscribe(synchData => { this.synchData = synchData; this.updateSynchData(); });

  }

}
