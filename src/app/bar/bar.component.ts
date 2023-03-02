import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from "d3";

import { RouteService } from '../route.service';
import { RouteInfo } from '../route-info';
import { RoutesInfo } from '../routes-info';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss']
})
export class BarComponent implements OnInit {

  unsubscribe$: Subject<boolean> = new Subject();
  public routesInfo = null

  @ViewChild('babar', { read: ElementRef, static: false }) tableView: ElementRef;

  private svg;
  private margin = { top: 10, right: 40, bottom: 30, left: 60 }
  private width
  private height

  public referenceRoute

  private createSvg(): void {

  }



  private drawBars(routesInfo: RoutesInfo): void {

    if (routesInfo.getRouteCount() < 2) {
      d3.selectAll(".graphLines").remove();

      return;
    }

    var referenceRoute = routesInfo.getReferenceRoute()

    this.width = this.tableView.nativeElement.offsetWidth - this.margin.left - this.margin.right
    this.height = this.tableView.nativeElement.offsetHeight - this.margin.top - this.margin.bottom;


    // console.log(this.width, this.height)

    var routeService = this.routeService
    var height = this.height

    // d3.select("svg").remove();
    if (!this.svg) {
      this.svg = d3.select("#bar")
        .append("svg")
        .attr("width", this.width + this.margin.left)
        .attr("height", this.height + this.margin.bottom)
        .attr('viewBox', '0 0 ' + (this.width + this.margin.left) + ' ' + (this.height + this.margin.bottom))
        .attr('preserveAspectRatio', 'xMinYMin')
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }


    d3.selectAll(".graphLines").remove();
    d3.selectAll(".graphParts").remove()


    var refLL = this.routesInfo.getReferenceRoute().getLatLngs().filter(ll => (ll.meta && ll.meta.placeholder !== true));
    // console.log(this.routesInfo.getReferenceRoute().getLatLngs())
    var distanceDomain = d3.extent(referenceRoute.getLatLngs(), function(d) { return d.meta.distance; })
    var distances = Array.from(referenceRoute.getLatLngs(), function(d: any) { return d.meta.distance; })

    // var dateDomain = d3.extent(referenceRoute.getLatLngs(), function(d) { return d.meta.time; })

    var dateDomain = d3.extent(Array.from(routesInfo.getRoutes(), r => {
      return [r.getLatLngs()[0].meta.time, r.getLatLngs()[r.getLatLngsCount() - 1].meta.time];
    }).flat())

    // console.log(dateDomain2)


    var dates = Array.from(referenceRoute.getLatLngs(), function(d: any) { return d.meta.time; })

    var timeDiffDomain = d3.extent(Array.from(routesInfo.getRoutes(), r => {
      return [d3.min(r.getLatLngs(), f => {
        return f.meta.timeDiff / 1000
      }), d3.max(r.getLatLngs(), f => {
        return f.meta.timeDiff / 1000
      })];
    }).flat())

    var rectangle = this.svg.append("g")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", "graphParts")
      .attr('fill', '#E8E8E8')


    var refVertLine = this.svg
      .append("line")
      .attr("class", "graphLines")
      .style("stroke-width", 2)
      .style("stroke", referenceRoute.getColor())
      .style("fill", "none");



    var focus = this.svg
      .append('g')
      .append('circle')
      .attr("class", "graphLines")
      .style("fill", "black")
      .attr("stroke", "black")
      .attr('r', 2.5)
      .style("opacity", 0)



    var x2 = d3.scaleTime()
      .domain(dateDomain)
      .range([0, this.width]);

    this.svg.append("g").attr("class", "graphParts")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x2));

    var x = d3.scaleLinear()
      .domain(distanceDomain)
      .range([0, this.width]);
    //
    this.svg.append("g").attr("class", "graphParts")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x).tickValues([]).tickFormat(x => `${(x / 1609.344).toFixed(1)}mi`));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain(timeDiffDomain).nice()
      .range([this.height, 0]);

    this.svg.append("g").attr("class", "graphParts")
      .call(d3.axisLeft(y).tickFormat(x => `${(x / 60).toFixed(0)}min`));

    var horzLine = this.svg
      .append("line")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", this.width)
      .attr("y2", y(0))
      .attr("class", "graphParts")
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .style("fill", "none");

    // Add the line
    let i
    for (i = 0; i < routesInfo.getRouteCount(); i++) {
      var route = routesInfo.getRoutes()[i]
      if (!route.isReference()) {
        this.svg.append("path")
          .attr("class", "graphLines")
          .datum(route.getLatLngs())
          .attr("fill", "none")
          .attr("stroke", route.getColor())
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .defined(d => !isNaN(d.meta.timeDiff) && d !== undefined)
            .x(function(d, i) { return x2(d.meta.time) })
            .y(function(d) { return y(d.meta.timeDiff / 1000) })
          )
      }

    }


    var bisect = d3.bisector(function(d) { return d.x; }).left;
    this.svg
      .append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseout', mouseout);

    function mouseover() {
      focus.style("opacity", 1)
      // focusText.style("opacity", 1)
    }

    function getClosest(number, array) {
      var current = array[0];
      var difference = Math.abs(number - current);
      var index = array.length;
      while (index--) {
        var newDifference = Math.abs(number - array[index]);
        if (newDifference < difference) {
          difference = newDifference;
          current = index;
        }
      }
      return current;
    };

    function mousemove(event) {
      let that = this

      var x0 = x2.invert(d3.pointer(event)[0]);
      var index = getClosest(x0, distances)

      var time = Math.round(new Date(x0).getTime() / 1000) * 1000


      if (referenceRoute) {

        routeService.updateMarkersLocations(time)

        let i
        for (i = 0; i < routesInfo.getRouteCount(); i++) {
          var route = routesInfo.getRoutes()[i]
          if (!route.isReference()) {
            var l = route.getMapByTime().get(time)
            if (l && l.meta.timeDiff) {
              focus
                .attr("cx", x2(time))
                .attr("cy", y(l.meta.timeDiff / 1000))
            }
          } else {
            refVertLine
              .attr("x1", x2(time))
              .attr("y1", 0)
              .attr("x2", x2(time))
              .attr("y2", height)
          }
        }
      }

    }
    function mouseout() {
      focus.style("opacity", 0)
    }
  }

  updateTimeBar(time) {

  }


  updateData() {
    let that = this;
    if (this.routesInfo !== undefined && this.routesInfo !== null) {
      this.drawBars(this.routesInfo);
    }
  }

  constructor(private routeService: RouteService) { }




  ngOnInit(): void {
    this.routeService.getRoutesObs().pipe(takeUntil(this.unsubscribe$)).subscribe(routes => { this.routesInfo = routes; this.updateData() });


  }

  ngAfterViewInit() {

  }



}
