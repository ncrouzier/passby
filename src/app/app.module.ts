import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { ColorPickerModule } from 'ngx-color-picker';


import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { BarComponent } from './bar/bar.component';
import { HomeComponent } from './home/home.component';
import { TableComponent } from './table/table.component';



@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    BarComponent,
    HomeComponent,
    TableComponent
  ],
  imports: [
    MatSliderModule,
    BrowserModule,
    BrowserAnimationsModule,
    ColorPickerModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
