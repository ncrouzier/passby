import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import * as L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor() { }

  private map;
  private mapObs$: BehaviorSubject<any> = new BehaviorSubject(null)
  getMapObs(): Observable<any> {
    return this.mapObs$.asObservable()
  }



  getMap() {
    return this.map
  }

  setMap(map: any) {
    this.map = map
  }

}
