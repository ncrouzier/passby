import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import { RouteService } from '../route.service';
import { MapService } from '../map.service';
import { RouteInfo } from '../route-info';
import { RoutesInfo } from '../routes-info';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorEvent } from 'ngx-color';


@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {
  @ViewChild('inputFile') myInputVariable: ElementRef;

  isOpen = false
  hideTable = true
  public routeForColor = null

  public startTime = null
  public endTime = null

  public sliderValue

  public sliderStartValue
  public sliderEndValue

  public sliderDValue
  public sliderDStartValue
  public sliderDEndValue
  public referenceRoute: RouteInfo

  // public synchDataKeys = []

  public dtwMap = new Map()
  public dtwMapKeys = []

  public dtwMapByLatLng = new Map()

  public interval = null
  public intervalIncre
  public initialIntervalIncre = 7

  public routesInfo


  public speedSliderValues = [
    { "display": 1, "real": 1000, "increment": 1000 },
    { "display": 2, "real": 500, "increment": 1000 },
    { "display": 4, "real": 250, "increment": 1000 },
    { "display": 8, "real": 125, "increment": 1000 },
    { "display": 10, "real": 100, "increment": 1000 },
    { "display": 20, "real": 50, "increment": 1000 },
    { "display": 50, "real": 20, "increment": 1000 },
    { "display": 100, "real": 10, "increment": 1000 },
    { "display": 200, "real": 5, "increment": 1000 },
    { "display": 400, "real": 5, "increment": 2000 },
    { "display": 1000, "real": 5, "increment": 5000 },
    { "display": 2000, "real": 5, "increment": 10000 },
    { "display": 5000, "real": 5, "increment": 25000 }
  ]

  public multiplier = this.speedSliderValues[this.initialIntervalIncre]


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
    let promises = [];
    var map = this.mapService.getMap()
    var fileReader = new FileReader();

    [...ee.target.files].forEach(file => {
      let filePromise = new Promise(resolve => {
        var fileReader = new FileReader();
        that.showErrorMsg = false
        fileReader.readAsText(file)
        fileReader.onload = (e) => {
          resolve(fileReader.result)
        }
      });
      promises.push(filePromise);

    })

    Promise.all(promises).then(fileContents => {
      try {
        fileContents.forEach(gpx => {
          var color = "#" + Math.floor(Math.random() * (1 << 3 * 8)).toString(16).padStart(6, "0")

          var layer = new L.GPX(gpx, {

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

          });
          map.fitBounds(layer.getLayers()[0].getBounds());
          that.routeService.addRoute(layer, color);
          map.addLayer(layer)
        })
        // console.log(layer)

      } catch (err) {
        that.showErrorMsg = true
        console.log('Error loading file: ' + err.err);
      }

      this.routeService.createSynchedData()
      that.resetSliders()
    })

    //clear input in case we want to reload the same
    that.myInputVariable.nativeElement.value = '';
  }



  test() {
    this.routeService.createSynchedData()
  }



  timeDiff(startTime, endTime) {
    var timeDiff = Math.abs(endTime.getTime() - startTime.getTime());
    return timeDiff;
  }



  getSliderTime(value) {
    if (this.referenceRoute) {
      return new Date(value).toLocaleTimeString()
    }
  }

  milliSecondsToTime(ms) {
    if (ms !== undefined) {
      return this.secondsToTime(ms / 1000)
    }
  }

  secondsToTime(e) {
    if (e !== undefined) {
      var aob = (e < 0) ? 'behind' : 'ahead';
      e = Math.abs(e)
      var h = Math.floor(e / 3600).toString().padStart(2, '0'),
        m = Math.floor(e % 3600 / 60).toString().padStart(2, '0'),
        s = Math.floor(e % 60).toString().padStart(2, '0');

      return h + ':' + m + ':' + s + ' ' + aob;
    }
  }

  updateMarkers(time) {
    // console.log(value)
    this.sliderValue = time;
    this.routeService.updateMarkersLocations(time);
    if (this.referenceRoute.getMapByTime().has(time)) {
      var index = this.referenceRoute.getMapByTime().get(time).meta.index
      if (index) this.sliderDValue = index
    }

    // this.sliderValue = value;
    // if (this.routesInfo && this.routesInfo.hasRoutes()) {
    //   var i: number
    //   for (i = 0; i < this.routesInfo.getRouteCount(); i++) {
    //     var route = this.routesInfo.getRoutes()[i]
    //
    //     if (route.getMapByTime().get(value)) {
    //       // console.log("update", route.getMapByTime().get(value))
    //       this.routeService.updateMarkerLocation(route.getMarker(), route.getMapByTime().get(value))
    //     }
    //
    //
    //     // if (this.dtwMap.has(value)) {
    //     //   this.routeService.getGap(this.dtwMap.get(value))
    //     // }
    //     //
    //     // if (route._info.isReference !== true && this.synchData.has(value) && this.synchData.get(value)[i] && this.synchData.get(value)[i].meta && this.synchData.get(value)[i].meta.timeDiff !== undefined) {
    //     //   console.log(i, new Date(value).toLocaleTimeString(), this.secondsToTime(this.synchData.get(value)[i].meta.timeDiff / 1000))
    //     // }
    //   }
    //
    //
    // }
  }

  updateDTW(index) {

    this.sliderDValue = index
    if (this.referenceRoute) {
      var time = new Date(this.referenceRoute.getTimeFromIndex(index)).getTime()
      this.sliderValue = time
      this.routeService.updateMarkersLocations(time);

    }


    // if (this.synchData !== undefined && this.synchData !== null && this.synchData.get('routes') !== 0) {
    //   var i: number
    //   for (i = 0; i < this.synchData.get('routes').length - 1; i++) {
    //     if (this.dtwMap.get(this.dtwMapKeys[value])[i]) {
    //       this.routeService.getGap(this.dtwMap.get(this.dtwMapKeys[value])[i])
    //     }
    //   }
    // }
  }



  updateData() {
    let that = this;
    if (this.routesInfo !== undefined && this.routesInfo !== null && this.routesInfo.hasRoutes()) {
      that.referenceRoute = this.routesInfo.getReferenceRoute()
      this.startTime = this.referenceRoute.getStartTime()
      this.endTime = this.referenceRoute.getEndTime()
      this.sliderStartValue = this.startTime
      this.sliderEndValue = this.endTime

      this.sliderDStartValue = 0
      this.sliderDEndValue = this.referenceRoute.getLatLngsCount() - 1

    } else {
      this.startTime = 0
      this.endTime = 0;
      this.sliderStartValue = this.startTime
      this.sliderEndValue = this.endTime
    }
  }


  triggerOrigin: any;

  openColorPicker(trigger: any, route) {
    this.triggerOrigin = trigger;
    this.isOpen = !this.isOpen
    this.routeForColor = route
  }

  handleColorChange($event: ColorEvent) {
    if (this.routeForColor !== null) {
      this.routeForColor.getMarker().options.icon.options.backgroundColor = $event.color.hex
      this.routeForColor.getMarker().options.icon.options.borderColor = $event.color.hex
      this.routeForColor.getMarker().setIcon(this.routeForColor.getMarker().options.icon)
      this.routeForColor.getRouteData().options.color = $event.color.hex
      this.routeForColor.getRouteData().setStyle({
        color: $event.color.hex
      });
      this.routeService.updateGraph()
    }

  }

  updateSynchData() {
    // let that = this
    // //update position slider
    // if (that.synchData !== undefined && that.synchData !== null && that.synchData.length !== 0) {
    //   that.synchDataKeys = [...that.synchData.keys()].slice(1).sort()
    //   if (this.sliderValue === undefined || this.sliderValue === null) {
    //     this.sliderValue = this.synchDataKeys[0]
    //   }
    //   // console.log(that.synchDataKeys)
    // } else {
    //   that.stop()
    //   that.resetSliders()
    // }
  }

  updateDtwMapData() {
    let that = this
    if (that.dtwMap !== undefined && that.dtwMap !== null) {
      console.log("in", this.dtwMap)
      that.dtwMapKeys = [...that.dtwMap.keys()]
      console.log(that.dtwMapKeys)
    }
  }


  getReferenceRoute() {
    return this.routeService.getReferenceRoute();
  }



  resetSliders() {
    this.sliderValue = this.sliderStartValue
    this.sliderDValue = this.sliderDStartValue
    this.updateMarkers(this.sliderValue)
    this.updateDTW(this.sliderDValue)
  }

  changeToReference(_route) {
    this.routesInfo.setReferenceRoute(_route)
    this.updateData()
    this.resetSliders()
    this.routeService.createSynchedData()

  }



  changeSpeed(value) {
    this.multiplier = this.speedSliderValues[value]
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
    } else if (this.routesInfo !== undefined && this.routesInfo !== null) {
      this.interval = setInterval(() => {
        if (this.sliderValue >= this.sliderEndValue - 1) {
          this.sliderValue = this.sliderStartValue
        } else {
          if (this.multiplier.increment > 1000) {
            this.sliderValue = Math.min(this.sliderValue + this.multiplier.increment, this.sliderEndValue)
          } else {
            this.sliderValue += this.multiplier.increment
          }
          this.updateMarkers(this.sliderValue)
        }
      }, this.multiplier.real)
    }
  }

  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null;
    }
  }

  fw() {
    if (this.sliderValue < this.sliderEndValue) {
      this.sliderValue += 1000
      this.updateMarkers(this.sliderValue)
    }
  }

  bw() {
    if (this.sliderValue > this.sliderStartValue) {
      this.sliderValue -= 1000
      this.updateMarkers(this.sliderValue)
    }
  }

  deleteRoute(route: any) {
    let that = this;
    that.routeService.deleteRoute(route)
  }

  sort() {
    return this.routesInfo.sort(function(a, b) {
      return b.isReference() - a.isReference();
    });

  }

  ngOnInit(): void {
    this.routeService.getRoutesObs().pipe(takeUntil(this.unsubscribe$)).subscribe(routes => { this.routesInfo = routes; this.updateData() });
    // this.routeService.getSynchDataObs().pipe(takeUntil(this.unsubscribe$)).subscribe(synchData => { if (synchData != null) { this.synchData = synchData; this.updateSynchData(); } });
    this.routeService.getDtwPathObs().pipe(takeUntil(this.unsubscribe$)).subscribe(dtwPathData => { if (dtwPathData != null) { this.dtwMap = dtwPathData.dtwMap; this.dtwMapByLatLng = dtwPathData.dtwMapByLatLng; this.updateDtwMapData(); } });

  }

}
