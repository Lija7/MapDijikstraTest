import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { NgxMapLibreGLModule } from '@maplibre/ngx-maplibre-gl';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './NavBar/navbar/navbar.component';
import { MapaComponent } from './Mapa/mapa.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MapaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatButtonModule,
    NgxMapLibreGLModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
