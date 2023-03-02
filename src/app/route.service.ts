import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';
import 'BeautifyMarker'
import frechet from 'frechet' // to remove maybe
import dtw from 'dynamic-time-warping'
import dtw2 from 'dtw'
import { RouteInfo } from './route-info';
import { RoutesInfo } from './routes-info';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  private routesInfo: RoutesInfo

  private t
  private ref
  private dtwPath = []

  private synchedRoutesMappedByTime = new Map()
  private synchedRoutesMappedByRoute = new Map()
  private dtwMap = new Map()
  private dtwMapByLatLng = new Map()

  private routes = new L.layerGroup()
  private routesObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private deletedRouteObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private markerObs$: BehaviorSubject<any> = new BehaviorSubject(null)

  private synchDataObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private dtwPathObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  private getPolyObs$: BehaviorSubject<any> = new BehaviorSubject(null)

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

  getDtwPathObs(): Observable<any> {
    return this.dtwPathObs$.asObservable()
  }

  getPolyObs(): Observable<any> {
    return this.getPolyObs$.asObservable()
  }

  constructor() {
    console.log("init routes info")
    this.routesInfo = new RoutesInfo()
  }


  updateMarkersLocations(time) {
    let i
    for (i = 0; i < this.routesInfo.getRouteCount(); i++) {
      var route = this.routesInfo.getRoutes()[i]
      if (route.getMapByTime().get(time)) {
        this.markerObs$.next({ marker: route.getMarker(), latLng: route.getMapByTime().get(time) })
        if (!route.isReference() && route.getTimeDiffFromTime(time)) {
          // console.log(route.getTimeDiffFromTime(time))
        } else {
          if (!route.isReference()) {
            // console.log(time, new Date(time))
          }
        }
      } else if (time > route.getEndTime() || time < route.getStartTime()) {
        //remove
        this.markerObs$.next({ marker: route.getMarker(), latLng: null })

      }
    }
  }


  updatePoly(polyCell) {
    console.log(polyCell)
    this.getPolyObs$.next([new L.LatLng(this.synchedRoutesMappedByTime[polyCell[0] + 1][0].lat, this.synchedRoutesMappedByTime[polyCell[0] + 1][0].lng), new L.LatLng(this.synchedRoutesMappedByTime[polyCell[1] + 1][1].lat, this.synchedRoutesMappedByTime[polyCell[1] + 1][1].lng)])
  }

  getGap(values: any) {
    this.getPolyObs$.next(values)
    // var res = Math.round(new Date(this.t2[this.dtwPath[i][1]].meta.time).getTime() / 1000 - new Date(this.t1[this.dtwPath[i][0]].meta.time).getTime() / 1000)
    // console.log(values)
    // return res;

    // var i
    // for (i = 0; i < this.dtwPath.length; i++) {
    //   if (this.dtwPath[i][0] === value) { // TODO: PAS BON
    //
    //     console.log(value, new Date(this.t2[this.dtwPath[i][1]].meta.time), new Date(this.t1[this.dtwPath[i][0]].meta.time))
    //     this.getPolyObs$.next([this.t1[this.dtwPath[i][0]], this.t2[this.dtwPath[i][1]]])
    //     var res = Math.round(new Date(this.t2[this.dtwPath[i][1]].meta.time).getTime() / 1000 - new Date(this.t1[this.dtwPath[i][0]].meta.time).getTime() / 1000)
    //     console.log(res)
    //     return res
    //   }
    // }
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
    if (this.routesInfo.getRouteCount() === 0) {
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

    this.routesInfo.addRoute(new RouteInfo(route._info.name, route))

    // this.markerObs$.next({ marker: route.marker, latLng: this.getRouteLatLngs(route)[0] })
    // this.routes.addLayer(route)
    this.routesObs$.next(this.routesInfo)

  }

  updateGraph() {
    this.routesObs$.next(this.routesInfo)
  }

  removeCol(arr, colIndex) {
    for (var i = 0; i < arr.length; i++) {
      var row = arr[i]
      row.splice(colIndex, 1)
    }
  }

  deleteRoute(route: any) {
    let that = this
    that.routesInfo.deleteRoute(route)
    //If deleted route was reference than set another one to be reference route
    if (route.isReference() && that.routesInfo.getRoutes()[0]) {
      this.routesInfo.setReferenceRoute(that.routesInfo.getRoutes()[0])
    }
    this.routesObs$.next(this.routesInfo)
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
    let that = this
    // this.routesInfo = new RoutesInfo()
    // var refRroute = new RouteInfo("reference", that.getReferenceRoute())
    var distFunc = function(a, b) {
      return a.distanceTo(b);
    };
    var DTW = require('dtw');
    var dtw = new DTW({ distanceFunction: distFunc });

    let i
    for (i = 0; i < this.routesInfo.getRouteCount(); i++) {
      var route = this.routesInfo.getRoutes()[i]
      if (!route.isReference()) {
        console.log(this.routesInfo.getRouteCount(), 'start compute for ' + route.getName())
        var ref = [], rt = []
        if (this.routesInfo.getReferenceRoute().getLatLngsCount() > 1500) {
          var factor = Math.ceil(this.routesInfo.getReferenceRoute().getLatLngsCount() / 1500)
          console.log(factor)
          ref = this.routesInfo.getReferenceRoute().getLatLngs().filter(function(_, i) {
            return !((i + 1) % factor);
          })
          console.log("reduced ref to " + ref.length + " from " + this.routesInfo.getReferenceRoute().getLatLngsCount())
        } else {
          ref = this.routesInfo.getReferenceRoute().getLatLngs()
        }
        if (route.getLatLngsCount() > 1500) {
          var factor = Math.ceil(route.getLatLngsCount() / 1500)
          rt = route.getLatLngs().filter(function(_, i) {
            return !((i + 1) % factor);
          })
          console.log("reduced rt to " + rt.length + " from " + route.getLatLngsCount())
        } else {
          rt = route.getLatLngs()
        }


        var cost = dtw.compute(ref, rt)
        var path = dtw.path()
        //remove last
        path.pop()
        //remove first
        path.shift()
        console.log(path)

        let y, prevRefTime, prevDiffTime
        for (y = 0; y < path.length; y++) {
          var time = new Date(path[y][1].meta.time).getTime() // route time
          var timediff = this.timeDiff(path[y][0], path[y][1])
          if (route.getMapByTime().has(time)) {


            if (prevRefTime && timediff && time - prevRefTime > 1000) { // we have a gap   TODO: maybe do this afterwards looping on full routes
              // console.log(prevDiffTime, "===>")
              let x
              var calcDiffTime = prevDiffTime
              for (x = prevRefTime + 1000; x < time; x += 1000) {
                if (route.getMapByTime().has(x)) {
                  calcDiffTime = Math.round(calcDiffTime + (timediff - prevDiffTime) / ((time - prevRefTime) / 1000))
                  // console.log(calcDiffTime)
                  route.getMapByTime().get(x).meta.timeDiff = calcDiffTime;
                  route.getMapByTime().get(x).meta.refRoute = this.routesInfo.getReferenceRoute().getMapByTime().get(time)
                } else {
                  // console.log("nop")
                }
              }
              // console.log("<===", timediff)
            } //end TODO
            //
            // if(route.getMapByTime().has(routeTime) && route.getMapByTime().get(routeTime).meta.timeDiff !== undefined){
            //   timediff = this.timeDiff(path[y][0], path[y][1])
            //   route.getMapByTime().get(routeTime).meta.timeDiff = timediff;
            // }

            route.getMapByTime().get(time).meta.timeDiff = timediff;
            route.getMapByTime().get(time).meta.refRoute = this.routesInfo.getReferenceRoute().getMapByTime().get(time)
            prevRefTime = time
            prevDiffTime = timediff

          } else {
            // console.log(new Date(time))
            // route.getMapByTime().get(routeTime).meta.timeDiff = timediff;
          }

          route.getMapByRefTime().set(time, path[y][1])
        }

      }

    }
    // console.log(this.routesInfo)
    this.routesObs$.next(this.routesInfo)
  }





  createSynchedData2() {
    // console.time('createSynchedData')
    let that = this;

    if (that.getReferenceRoute() === undefined) {
      //probably no routes anymore, update synchData (maybe after last delete)
      this.synchDataObs$.next([])
      // console.timeEnd('createSynchedData')
      return;
    }

    this.synchedRoutesMappedByRoute = new Map()

    var referenceLatLngArray = that.getRouteLatLngs(that.getReferenceRoute());
    var startReferenceDate = new Date(referenceLatLngArray[0].meta.time)
    var endReferenceDate = new Date(referenceLatLngArray[referenceLatLngArray.length - 1].meta.time)

    if (referenceLatLngArray) {
      let numberOfRoutes = that.routes.getLayers().length
      // var timeWindowInSec = Math.abs((endReferenceDate.getTime() - startReferenceDate.getTime()) / 1000)
      // console.log(timeWindowInSec + " " + referenceLatLngArray.length)

      that.synchedRoutesMappedByTime = new Map()
      that.synchedRoutesMappedByTime.set('routes', new Array(numberOfRoutes))


      var i: number
      var routeNumber = 0
      for (i = 0; i < this.routes.getLayers().length; i++) {
        let route = this.routes.getLayers()[i];
        let startTime = that.getRouteLatLngs(route)[0].meta.time
        let endTime = that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].meta.time
        if (new Date(endTime).getTime() < startReferenceDate.getTime() || new Date(startTime).getTime() > endReferenceDate.getTime()) {
          this.removeCol(that.synchedRoutesMappedByTime, routeNumber)
          routeNumber--
          console.log("OUT OF SCOPE")
        } else {
          //insert
          that.synchedRoutesMappedByTime.get('routes')[routeNumber] = route
          this.synchedRoutesMappedByRoute.set(route, [])

          var ll_i = 0
          for (ll_i = 0; ll_i < that.getRouteLatLngs(route).length; ll_i++) {
            var llTime = new Date(that.getRouteLatLngs(route)[ll_i].meta.time).getTime()
            // console.log(new Date(llTime).toLocaleString())
            if (!that.synchedRoutesMappedByTime.has(llTime)) {
              that.synchedRoutesMappedByTime.set(llTime, new Array(numberOfRoutes))
            }
            that.synchedRoutesMappedByTime.get(llTime)[routeNumber] = that.getRouteLatLngs(route)[ll_i]
            this.synchedRoutesMappedByRoute.get(route).push(that.getRouteLatLngs(route)[ll_i])

          }




          routeNumber++
        }

      }

      // var timelist = [...this.synchedRoutesMappedByTime.keys()].slice(1).sort()
      // var endAll = new Date(timelist[timelist.length - 1]).getTime()
      // //fill the ends
      // for (i = 0; i < this.routes.getLayers().length; i++) {
      //   let route = this.routes.getLayers()[i];
      //   let endTime = new Date(that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].meta.time).getTime()
      //   var t
      //   for (t = endTime + 1000; t <= endAll; t += 1000) {
      //     if (that.synchedRoutesMappedByTime.has(t)) {
      //       var l = new L.LatLng(that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].lat, that.getRouteLatLngs(route)[that.getRouteLatLngs(route).length - 1].lng);
      //       l.meta = { time: new Date(t), placeholder: true }
      //       that.synchedRoutesMappedByTime.get(t)[i] = l
      //     }
      //   }
      // }



      console.log(that.synchedRoutesMappedByTime)
    }


    if (this.synchedRoutesMappedByTime.get('routes').length > 1) {
      this.test()
    }

    this.synchDataObs$.next(that.synchedRoutesMappedByTime)
    // console.timeEnd('createSynchedData')
  }

  test() {
    this.dtwMap.clear()
    this.t = new Array(this.synchedRoutesMappedByTime.get('routes').length - 1)
    this.ref = []
    // this.t2 = []
    console.time('createSynchedData')

    var listRoutes = this.synchedRoutesMappedByTime.get('routes')
    let refIndex: number
    for (refIndex = 0; refIndex < listRoutes.length; refIndex++) {
      if (this.synchedRoutesMappedByTime.get('routes')[refIndex]._info.isReference === true) {
        break;
      }
    }
    var synchDataKeys = [...this.synchedRoutesMappedByTime.keys()].slice(1).sort()
    var r
    var routeNumber = 0
    for (r = 0; r < listRoutes.length; r++) {
      if (listRoutes[r]._info.isReference && listRoutes[r]._info.isReference === true) {
        //do nothing, this is the reference route
      } else {
        this.ref = []
        this.t[routeNumber] = []
        let i
        for (i = 0; i < synchDataKeys.length; i += 1) {
          if (this.synchedRoutesMappedByTime.get(synchDataKeys[i])[refIndex] !== undefined) {
            if (this.synchedRoutesMappedByTime.get(synchDataKeys[i])[r] !== undefined) {
              this.ref.push(this.synchedRoutesMappedByTime.get(synchDataKeys[i])[refIndex])
              this.t[routeNumber].push(this.synchedRoutesMappedByTime.get(synchDataKeys[i])[r])
            }
          }
        }
        console.log(this.ref, this.t[routeNumber])

        var distFunc = function(a, b) {
          return a.distanceTo(b);
        };
        var DTW = require('dtw');
        var dtw = new DTW({ distanceFunction: distFunc });
        var cost = dtw.compute(this.ref, this.t[routeNumber]);
        var path = dtw.path();

        var dtwPath = path

        for (i = 0; i < dtwPath.length; i++) {
          var refTime = new Date(dtwPath[i][0].meta.time).getTime() // ref time
          if (this.dtwMap.has(refTime)) {
            this.dtwMap.get(refTime)[routeNumber] = dtwPath[i]
          } else {
            this.dtwMap.set(refTime, new Array(listRoutes.length - 1))
            this.dtwMap.get(refTime)[routeNumber] = dtwPath[i]
          }
          var timediff = this.timeDiff(dtwPath[i][1], dtwPath[i][0])
          this.synchedRoutesMappedByTime.get(refTime)[r].meta.timeDiff = timediff;
        }


        routeNumber++
      }
    }
    this.dtwMap = new Map([...this.dtwMap.entries()].sort());
    console.log(this.dtwMap)

    let routenumber = this.synchedRoutesMappedByTime.get('routes').length - 1
    let i
    let ll = this.getRouteLatLngs(this.getReferenceRoute())
    for (i = 0; i < ll.length; i++) {
      // this.dtwMapByLatLng.set(ll[i], new Array(routenumber))
      let reftime = new Date(ll[i].meta.time).getTime()
      this.dtwMapByLatLng.set(ll[i], this.dtwMap.get(refTime))
    }
    console.log(this.dtwMapByLatLng)
    console.log(this.ref, this.t)



    console.timeEnd('createSynchedData')
    this.dtwPathObs$.next({ "dtwMap": this.dtwMap, "dtwMapByLatLng": this.dtwMapByLatLng })

  }

  timeDiff(a, b) {
    return new Date(a.meta.time).getTime() - new Date(b.meta.time).getTime()
  }


}
