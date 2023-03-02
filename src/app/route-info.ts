import * as L from 'leaflet';
import GeographicLib from 'geographiclib'
import * as d3 from "d3";

export class RouteInfo {

  private name
  private routeObject
  private mapByTime = new Map()
  private mapByRefTime = new Map()
  private mapByLocation = new Map()

  private Geodesic = GeographicLib.Geodesic
  private geod = GeographicLib.Geodesic.WGS84;

  private readonly PAUSE_TIME = 1500000

  constructor(private _name: String, private _routeObject: any) {

    this.name = _name
    this.routeObject = _routeObject
    this.fillEmptyTimes()
    this.createMaps()
  }


  createMaps() {
    let i
    for (i = 0; i < this.getLatLngs().length; i++) {
      this.getLatLngs()[i].meta.index = i
      this.mapByTime.set(new Date(this.getLatLngs()[i].meta.time).getTime(), this.getLatLngs()[i])
    }
    //sort, might not be necessary
    this.mapByTime = new Map([...this.mapByTime.entries()].sort());


  }

  fillEmptyTimes() {//and compute distance
    var oldA = this.getLatLngs()
    var newA = new Array()
    let i
    let inGap
    for (i = 0; i < oldA.length; i++) {
      if (i === 0) {
        // oldA[i].meta.distance = 0
        newA.push(oldA[i])
      } else if (i > 0) {
        let currentDate = new Date(oldA[i].meta.time).getTime()
        let oldDate = new Date(oldA[i - 1].meta.time).getTime()
        if (currentDate === oldDate + 1000) {
          // oldA[i].meta.distance = oldA[i - 1].meta.distance + oldA[i].distanceTo(oldA[i - 1])
          newA.push(oldA[i])
        } else {
          let missingNumber = (currentDate - oldDate) / 1000 - 1;
          if (missingNumber <= this.PAUSE_TIME) {
            let y
            var ll = this.geod.InverseLine(oldA[i - 1].lat, oldA[i - 1].lng, oldA[i].lat, oldA[i].lng)
            // var oldL;
            for (y = 1; y <= missingNumber; y++) {
              var r = ll.Position((ll.s13 / (missingNumber + 1)) * y, this.Geodesic.LATITUDE | this.Geodesic.LONGITUDE);
              var l = new L.LatLng(r.lat2.toFixed(8), r.lon2.toFixed(8));
              l.meta = { time: new Date(new Date(oldA[i - 1].meta.time).getTime() + y * 1000), placeholder: true }
              if (y === 1) {
                // l.meta.distance = oldA[i - 1].meta.distance = l.distanceTo(oldA[i - 1])
              } else {
                // l.meta.distance = oldL.meta.distance = l.distanceTo(oldL)
              }
              // oldL = l
              newA.push(l)
            }
            // oldA[i].meta.distance = oldL.meta.distance + oldA[i].distanceTo(oldL)
          }
          newA.push(oldA[i])
        }
      }
    }

    //distance
    for (i = 0; i < newA.length; i++) {
      if (i === 0) {
        newA[i].meta.distance = 0
      } else {
        newA[i].meta.distance = newA[i - 1].meta.distance + newA[i].distanceTo(newA[i - 1])
      }
    }


    //find first and last valid timeDIff, save index of missing in array then d3.range(from,to, array.length);
    console.log("lKJSDflsjdlfkjsldkfj")
    if (!this.isReference()) {
      let inEmpty = false
      var arrayOfEmpty = []
      var lastValidTimeDiff
      for (i = 0; i < newA.length; i++) {
        if (i > 0) {
          let currentTimeDiff = newA[i].meta.timeDiff
          // console.log(newA[i].meta.timeDiff)
          if (currentTimeDiff) {
            if (inEmpty) {
              //were are the end
              let values = d3.range(currentTimeDiff, lastValidTimeDiff, arrayOfEmpty.length)
              // console.log(values)
              let y
              for (y = 0; y < arrayOfEmpty; y++) {
                newA[arrayOfEmpty[y]].meta.timeDiff = values[y]
                console.log(values[y])
              }
              arrayOfEmpty = []
              inEmpty = false
            }
            lastValidTimeDiff = currentTimeDiff

          } else {
            inEmpty = true
            arrayOfEmpty.push(i)
          }


        }



      }
    }



    // console.log(newA)
    // console.log(oldA)
    this.getRouteData()._latlngs = newA
  }

  getName() {
    return this.name
  }

  isReference() {
    if (this.routeObject && this.routeObject._info && this.routeObject._info.isReference === true) {
      return true
    } else {
      return false
    }
  }

  setReference(bool: boolean) {
    this.routeObject._info.isReference = bool
  }

  getDistanceToRef() {
    return 0
    // return this.routeObject._info.distanceToRef
  }

  getColor() {
    return this.getRouteData().options.color
  }

  getMarker() {
    return this.routeObject.marker
  }

  getRouteData() {
    return this.routeObject.getLayers()[0]
  }

  getLatLngs() {
    return this.getRouteData()._latlngs
  }

  getTimeFromIndex(index) {
    if (this.getLatLngs()[index]) {
      return new Date(this.getLatLngs()[index].meta.time).getTime()
    }
  }

  getTimeDiffFromIndex(index) {
    if (this.getLatLngs()[index]) {
      return this.getLatLngs()[index].meta.timeDiff
    }
  }

  getTimeDiffFromTime(time) {
    if (this.getMapByTime().has(time)) {
      return this.getMapByTime().get(time).meta.timeDiff
    }
  }

  getRefRoute(time) {
    if (this.getMapByTime().has(time)) {
      return this.getMapByTime().get(time).meta.refRoute
    }
  }

  getLatLng(index) {
    if (this.getLatLngs()[index]) {
      return this.getRouteData()[index]
    }
  }



  getLatLngsCount() {
    return this.getLatLngs().length
  }

  getStartTime() {
    return new Date(this.getLatLngs()[0].meta.time).getTime()
  }

  getEndTime() {
    return new Date(this.getLatLngs()[this.getLatLngs().length - 1].meta.time).getTime()
  }

  getMapByTime() {
    return this.mapByTime
  }

  getMapByRefTime() {
    return this.mapByRefTime
  }

  getTimeDiffAtRefTime(time) {
    if (this.getMapByRefTime().has(time)) {
      return this.getMapByRefTime().get(time).meta.timeDiff
    }
  }
}
