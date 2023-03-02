import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})



export class HomeComponent implements OnInit {
  public barWidth

  @ViewChild('barDiv', { read: ElementRef, static: false }) barView: ElementRef;
  @ViewChild('table', { read: ElementRef, static: false }) tableView: ElementRef;

  @HostListener('window:resize', ['$event']) onScrollEvent($event) {
    this.resize()
  }


  resize() {
    // console.log(window.innerHeight < this.tableView.nativeElement.offsetHeight + this.barView.nativeElement.offsetHeight + 45);
    if (window.innerHeight < this.tableView.nativeElement.offsetHeight + this.barView.nativeElement.offsetHeight + 45) {
      // console.log(window.innerWidth, window.outerWidth)
      this.barWidth = 'calc(100% - ' + (this.tableView.nativeElement.offsetWidth + 50) + 'px);'// 'this.tableView.nativeElement.offsetWidth + 10 + 'px'
      // console.log(this.barWidth)
    } else {
      this.barWidth = "calc(100% - 40px)"
    }
    this.routeService.updateGraph()
  }

  constructor(private routeService: RouteService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.resize()
    this.cdr.detectChanges();
  }



}
