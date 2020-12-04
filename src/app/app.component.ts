import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MapComponent } from './map/map.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild(MapComponent) chile;

  title = 'GPX passby thingy';

  message: string;

  ngOnInit() {
  }

  ngAfterViewInit() {
  }
}
