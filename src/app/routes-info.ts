import { RouteInfo } from './route-info';


export class RoutesInfo {

  private routes: RouteInfo[]


  constructor() {
    this.routes = new Array<RouteInfo>()
  }

  getReferenceRoute() {
    let i: number
    for (i = 0; i < this.routes.length; i++) {
      if (this.routes[i].isReference() === true) {
        return this.routes[i]
      }
    }
  }

  setReferenceRoute(route: RouteInfo) {
    if (this.getReferenceRoute()) {
      this.getReferenceRoute().setReference(false)
    }
    let i: number
    for (i = 0; i < route.getLatLngs().length; i++) {
      delete route.getLatLngs()[i].meta.timeDiff
      delete route.getLatLngs()[i].meta.refRoute
    }
    route.setReference(true)
  }

  deleteRoute(route: RouteInfo) {
    let i: number
    for (i = 0; i < this.routes.length; i++) {
      if (this.routes[i] === route) {
        this.routes.splice(i, 1)
      }
    }
  }

  addRoute(route: RouteInfo) {
    this.routes.push(route)
  }

  getRoutes() {
    return this.routes
  }

  getRouteCount() {
    return this.routes.length
  }

  hasRoutes() {
    return this.getRouteCount() > 0
  }

  sort(fc) {
    return this.routes.sort(fc)
  }




}
