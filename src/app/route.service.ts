import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';
import 'BeautifyMarker'

@Injectable({
  providedIn: 'root'
})
export class RouteService {




  private synchedRoutes = []

  private routes = new L.layerGroup()
  private routesObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private deletedRouteObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private markerObs$: BehaviorSubject<any> = new BehaviorSubject(null)

  private synchDataObs$: BehaviorSubject<any> = new BehaviorSubject(null)

  getRoutesObs(): Observable<any> {
    return this.routesObs$.asObservable()
  }
  getDeletedRouteObs(): Observable<any> {
    return this.deletedRouteObs$.asObservable()
  }
  getMarkerObs(): Observable<any> {
    return this.markerObs$.asObservable()
  }
  getSynchDataObs(): Observable<any> {
    return this.synchDataObs$.asObservable()
  }


  updateMarkerLocation(marker, latLng) {
    this.markerObs$.next({ marker: marker, latLng: latLng })
  }

  updateMarkerColor(route, color) {
    let i: number
    for (i = 0; i < this.routes.getLayers().length; i++) {
      if (this.routes.getLayers()[i] === route) {
        this.routes.getLayers()[i].marker.options.icon.options.backgroundColor = color
        this.routes.getLayers()[i].marker.options.icon.options.borderColor = color
        this.routes.getLayers()[i].marker.setIcon(this.routes.getLayers()[i].marker.options.icon)
        this.routes.getLayers()[i].options.polyline_options.color = color
        this.routes.getLayers()[i].setStyle({
          color: color
        });
      }
    }

    for (i = 0; i < this.synchedRoutes[0].length; i++) {
      if (this.synchedRoutes[0][i] === route) {
        this.synchedRoutes[0][i].marker.options.icon.options.backgroundColor = color
        this.synchedRoutes[0][i].marker.options.icon.options.borderColor = color
        this.synchedRoutes[0][i].marker.setIcon(this.synchedRoutes[0][i].marker.options.icon)
        this.synchedRoutes[0][i].options.polyline_options.color = color
        this.synchedRoutes[0][i].setStyle({
          color: color
        });

      }
    }

    this.routesObs$.next(this.routes)
    this.synchDataObs$.next(this.synchedRoutes)
  }

  getReferenceRoute() {
    let i: number
    for (i = 0; i < this.routes.getLayers().length; i++) {
      if (this.routes.getLayers()[i]._info.isReference === true) {
        return this.routes.getLayers()[i]
      }
    }

  }

  addRoute(route: any, _color: string) {
    //set as reference if it's the first
    if (this.routes.getLayers().length === 0) {
      route._info.isReference = true
    }
    var color = 'black'
    if (_color !== undefined) {
      color = _color;
    }
    //give it a marker
    route.marker = L.marker(this.getRouteLatLngs(route)[0], {
      icon: L.BeautifyIcon.icon({
        icon: 'running',
        backgroundColor: color,
        borderColor: color,
        textColor: 'white',
        iconShape: 'marker'
      })
    })
    this.markerObs$.next({ marker: route.marker, latLng: this.getRouteLatLngs(route)[0] })
    this.routes.addLayer(route)
    this.routesObs$.next(this.routes)
  }

  removeCol(arr, colIndex) {
    for (var i = 0; i < arr.length; i++) {
      var row = arr[i]
      row.splice(colIndex, 1)
    }
  }

  deleteRoute(route: any) {
    let that = this
    that.routes.removeLayer(route)
    //If deleted route was reference than set another one to be reference route
    if (route._info.isReference === true && that.routes.getLayers()[0]) {
      that.routes.getLayers()[0]._info.isReference = true
    }

    this.routesObs$.next(this.routes)
    this.deletedRouteObs$.next(route)
  }



  getRouteData(route) {
    if (route)
      return route.getLayers()[0]
  }

  getRouteLatLngs(route) {
    if (route)
      return this.getRouteData(route)._latlngs
  }


  createSynchedData() {
    // console.time('createSynchedData')
    let that = this;
    if (that.getReferenceRoute() === undefined) {
      //probably no routes anymore, update synchData (maybe after last delete)
      this.synchDataObs$.next([])
      // console.timeEnd('createSynchedData')
      return;
    }

    var referenceLatLngArray = that.getRouteLatLngs(that.getReferenceRoute());
    var startReferenceDate = new Date(referenceLatLngArray[0].meta.time)
    var endReferenceDate = new Date(referenceLatLngArray[referenceLatLngArray.length - 1].meta.time)

    if (referenceLatLngArray) {
      let numberOfRoutes = that.routes.getLayers().length
      var timeWindowInSec = Math.abs((endReferenceDate.getTime() - startReferenceDate.getTime()) / 1000)
      // console.log(timeWindowInSec + " " + referenceLatLngArray.length)

      that.synchedRoutes = new Array()
      that.synchedRoutes.push(new Array(numberOfRoutes))
      that.synchedRoutes[0][0] = that.getReferenceRoute();

      var time: number
      for (time = 0; time < timeWindowInSec + 1; time++) {
        var ar = new Array(numberOfRoutes)
        var l = new L.LatLng(null, null);
        l.meta = { time: new Date(startReferenceDate.getTime() + time * 1000), placeholder: true };
        ar[0] = l
        that.synchedRoutes.push(ar)
      }

      referenceLatLngArray.forEach(function(refrouteLatLng: any) {
        var ttt = Math.abs((new Date(refrouteLatLng.meta.time).getTime() - startReferenceDate.getTime()) / 1000)
        let data = new Array(numberOfRoutes)
        data[0] = refrouteLatLng
        that.synchedRoutes[ttt + 1][0] = data[0]
        // that.synchedRoutes.push([refrouteLatLng]);
      });

      //fill in the empty lat lng in reference route
      for (time = 1; time < timeWindowInSec + 1; time++) {
        if (that.synchedRoutes[time][0].meta.placeholder === true) {
          that.synchedRoutes[time][0].lat = that.synchedRoutes[time - 1][0].lat
          that.synchedRoutes[time][0].lng = that.synchedRoutes[time - 1][0].lng
        }
      }


      var i: number
      var routeNumber = 0
      for (i = 0; i < this.routes.getLayers().length; i++) {
        let route = this.routes.getLayers()[i];
        if (route._info.isReference !== true) {
          let startTime = that.getRouteLatLngs(route)[0].meta.time
          let endTime = that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].meta.time
          routeNumber++
          // if acitvity has zero time point in common with reference, we ignore it and remove it's place in the synchedRoutes data
          if (new Date(endTime) < new Date(referenceLatLngArray[0].meta.time) || new Date(startTime) > new Date(referenceLatLngArray[referenceLatLngArray.length - 1].meta.time)) {
            this.removeCol(that.synchedRoutes, routeNumber)
            routeNumber--
          } else {

            //insert
            that.synchedRoutes[0][routeNumber] = route

            //find when it starts and fill in a la bourrin
            var j: number

            var needtofillbeginingpoint = false
            var tt = 1
            var j = 0

            var latestInsertedData: { lat: any; lng: any; };

            dance:
            while (j < that.getRouteLatLngs(route).length - 1) {
              var currentDate = new Date(that.getRouteLatLngs(route)[j].meta.time)
              if (currentDate > endReferenceDate) {
                break dance
              }

              //Ignore everything that happened before the start of the reference activity
              while (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() < startReferenceDate.getTime()) {
                j++
              }

              // now we are in the time between the start of the reference acitivty and it's end (included)
              while (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() <= endReferenceDate.getTime()) {

                // if datapoint time equals to reference time, save it
                if (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() === new Date(that.synchedRoutes[tt][0].meta.time).getTime()) {
                  that.synchedRoutes[tt][routeNumber] = that.getRouteLatLngs(route)[j]
                  latestInsertedData = that.getRouteLatLngs(route)[j]

                  //we enter here if the first few points did not have a match with refernce. we backward fill with first datapoint we have in the valid interval
                  if (needtofillbeginingpoint) {
                    var h: number
                    for (h = 1; h < tt; h++) {
                      var l = new L.LatLng(that.synchedRoutes[tt][routeNumber].lat, that.synchedRoutes[tt][routeNumber].lng);
                      l.meta = { time: that.synchedRoutes[tt][0].meta.time, placeholder: true }
                      that.synchedRoutes[h][routeNumber] = l
                    }
                    //we never need to do this again for this route so we set the flag
                    needtofillbeginingpoint = false;
                  }
                  //we found a place to put the jth element, on to the next one
                  j++
                } else {
                  //if first datapoint is undefined, we set the flag to back fill as soon as we find a match
                  if (tt === 1) {
                    needtofillbeginingpoint = true
                  }
                  // since they don't match, that means the datapoint is missing for this time in the route, so we fill in a placeholder (copy the previous good one)
                  if (tt > 1 && that.synchedRoutes[tt - 1][routeNumber] !== undefined) {
                    var l = new L.LatLng(that.synchedRoutes[tt - 1][routeNumber].lat, that.synchedRoutes[tt - 1][routeNumber].lng);
                    l.meta = { time: that.synchedRoutes[tt - 1][0].meta.time, placeholder: true }
                    that.synchedRoutes[tt][routeNumber] = l
                    latestInsertedData = l
                  }
                }
                tt++

                // We are at the end of our datapoints
                if (j === that.getRouteLatLngs(route).length) {
                  //if we still have empty rows in our synchData, fill them with the last datapoint and the correct date
                  while (tt < that.synchedRoutes.length) {
                    var lastdata = that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1]
                    var l = new L.LatLng(lastdata.lat, lastdata.lng);
                    l.meta = { time: that.synchedRoutes[tt][0].meta.time, placeholder: true }
                    that.synchedRoutes[tt][routeNumber] = l
                    latestInsertedData = l
                    tt++
                  }
                  //then finish
                  break dance
                }

              }

              // if the activity ends after the reference but is missing points at the end (tt still < synchData length), we fill them with the last lat lng.
              // This can happen when activity does not record every second and the next data point would have been just after the reference end time
              while (tt < that.synchedRoutes.length) {
                var l = new L.LatLng(latestInsertedData.lat, latestInsertedData.lng);
                l.meta = { time: that.synchedRoutes[tt][0].meta.time, placeholder: true }
                that.synchedRoutes[tt][routeNumber] = l
                tt++
              }

              j++
            }


          }

        }

      }
      // console.log(that.synchedRoutes)
    }


    this.synchDataObs$.next(that.synchedRoutes)
    // console.timeEnd('createSynchedData')
  }

}
