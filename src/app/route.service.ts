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

    // var i = 0;
    // var indextodelete
    // that.synchedRoutes[0].forEach(function(_route: any) {
    //   if (route == _route) {
    //     indextodelete = i
    //   }
    //   i++
    // })
    // if (indextodelete !== undefined) {
    //   that.removeCol(that.synchedRoutes, indextodelete)
    // }
    // this.synchDataObs$.next(that.synchedRoutes)

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
    let that = this;
    if (that.getReferenceRoute() === undefined) {
      //probably no routes anymore, update synchData (maybe after last delete)
      this.synchDataObs$.next([])
      return;
    }

    var referenceLatLngArray = that.getRouteLatLngs(that.getReferenceRoute());
    var startReferenceDate = new Date(referenceLatLngArray[0].meta.time)
    // console.log(referenceLatLngArray[0])
    var endReferenceDate = new Date(referenceLatLngArray[referenceLatLngArray.length - 1].meta.time)

    if (referenceLatLngArray) {
      let numberOfRoutes = that.routes.getLayers().length
      var timeWindowInSec = Math.abs((endReferenceDate.getTime() - startReferenceDate.getTime()) / 1000)
      // console.log(timeWindowInSec + " " + referenceLatLngArray.length)

      that.synchedRoutes = new Array()
      that.synchedRoutes.push(new Array(numberOfRoutes))
      that.synchedRoutes[0][0] = that.getReferenceRoute();

      var time
      for (time = 0; time < timeWindowInSec + 1; time++) {
        var ar = new Array(numberOfRoutes)
        var l = new L.LatLng(null, null);
        l.meta = { time: null, placeholder: true }; l.meta.time = new Date(startReferenceDate.getTime() + time * 1000)
        ar[0] = l
        that.synchedRoutes.push(ar)
      }

      // let data = new Array(numberOfRoutes)
      // data[0] = that.getReferenceRoute()

      referenceLatLngArray.forEach(function(refrouteLatLng: any) {

        var ttt = Math.abs((new Date(refrouteLatLng.meta.time).getTime() - startReferenceDate.getTime()) / 1000)
        let data = new Array(numberOfRoutes)
        data[0] = refrouteLatLng
        that.synchedRoutes[ttt + 1][0] = data[0]
        // that.synchedRoutes.push([refrouteLatLng]);
      });



      var i
      var routeNumber = 0
      for (i = 0; i < this.routes.getLayers().length; i++) {
        let route = this.routes.getLayers()[i];
        if (route._info.isReference !== true) {
          let startTime = that.getRouteLatLngs(route)[0].meta.time
          let endTime = that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].meta.time
          routeNumber++
          if (new Date(endTime) < new Date(referenceLatLngArray[0].meta.time) || new Date(startTime) > new Date(referenceLatLngArray[referenceLatLngArray.length - 1].meta.time)) {
            // console.log("out of scope")
            this.removeCol(that.synchedRoutes, routeNumber)
            routeNumber--
          } else {

            //insert
            that.synchedRoutes[0][routeNumber] = route

            //find when it starts and fill in a la bourrin
            var j: number


            var tt = 1
            j = 0
            dance:
            while (j < that.getRouteLatLngs(route).length - 1) {
              var currentDate = new Date(that.getRouteLatLngs(route)[j].meta.time)
              if (currentDate > endReferenceDate) {
                break dance
              }
              while (new Date(that.getRouteLatLngs(route)[j].meta.time) < startReferenceDate) {
                j++
              }

              while (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() <= endReferenceDate.getTime()) {
                // console.log(new Date(that.getRouteLatLngs(route)[j].meta.time) + " " + new Date(that.synchedRoutes[tt][0].meta.time))
                if (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() === new Date(that.synchedRoutes[tt][0].meta.time).getTime()) {
                  that.synchedRoutes[tt][routeNumber] = that.getRouteLatLngs(route)[j]
                  j++
                }
                // else {
                //   var l = new L.LatLng(null, null);
                //   l.meta = { time: new Date(that.getRouteLatLngs(route)[j].meta.time), placeholder: true }
                //   that.synchedRoutes[tt][routeNumber] = l
                // }

                tt++
                if (j >= that.getRouteLatLngs(route).length) {
                  break dance
                }
              }


              j++
            }

            // var tt = 0
            // j = 0
            // dance:
            // while (j < that.getRouteLatLngs(route).length - 1) {
            //   var currentDate = new Date(that.getRouteLatLngs(route)[j].meta.time)
            //   if (currentDate > endReferenceDate || tt >= referenceLatLngArray.length) {
            //     break dance
            //   }
            //   while (new Date(that.getRouteLatLngs(route)[j].meta.time) < startReferenceDate) {
            //     j++
            //   }
            //
            //   while (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() > new Date(referenceLatLngArray[tt].meta.time).getTime()) {
            //     tt++
            //     if (tt >= referenceLatLngArray.length) {
            //       break dance
            //     }
            //   }
            //
            //   while (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() <= new Date(referenceLatLngArray[tt].meta.time).getTime()) {
            //
            //
            //     if (new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() === new Date(referenceLatLngArray[tt].meta.time).getTime()) {
            //       var ttt = Math.abs((new Date(that.getRouteLatLngs(route)[j].meta.time).getTime() - startReferenceDate.getTime()) / 1000)
            //
            //       that.synchedRoutes[ttt + 1][routeNumber] = that.getRouteLatLngs(route)[j]
            //       tt++
            //       if (tt >= referenceLatLngArray.length) {
            //         break dance
            //       }
            //     }
            //
            //     j++
            //     if (j >= that.getRouteLatLngs(route).length) {
            //       break dance
            //     }
            //   }
            //
            //
            //   j++
            // }


          }

        }

      }
      // console.log(that.synchedRoutes)

    }

    //remove routes that didn't make the cut (not in time frame)
    // var i
    // var res = []
    // for (i=0;i < this.synchedRoutes[0].length;i++){
    //   if (this.synchedRoutes[0][i] === undefined){
    //     res.push()
    //   }
    //
    // }
    // this.removeCol(that.synchedRoutes,2)

    this.synchDataObs$.next(that.synchedRoutes)
  }

}
