import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  layerGrp;

  constructor() { }

  ngOnInit(): void {
  }


  receiveMessage($event) {
    console.log("received");
    this.layerGrp = $event
  }

}
