import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { ColorCircleModule } from 'ngx-color/circle'; // <color-circle></color-circle>
import { OverlayModule } from '@angular/cdk/overlay';
import { ColorChromeModule } from 'ngx-color/chrome'; // <color-chrome></color-chrome>
import { FlexLayoutModule } from '@angular/flex-layout';



import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { BarComponent } from './bar/bar.component';
import { HomeComponent } from './home/home.component';
import { TableComponent } from './table/table.component';
import { TitleComponent } from './title/title.component';



@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    BarComponent,
    HomeComponent,
    TableComponent,
    TitleComponent
  ],
  imports: [
    MatSliderModule,
    BrowserModule,
    BrowserAnimationsModule,
    ColorCircleModule,
    ColorChromeModule,
    OverlayModule,
    FlexLayoutModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
