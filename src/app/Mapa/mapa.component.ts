import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl, Popup, Offset, GeolocateControl } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map, sample } from 'rxjs';
import { Koordinate } from '../Model/Koordinate.model';
import { Mesto } from '../Model/Mesto.model';
import { MapeService } from './mape.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {

  map: Map | undefined;

  mesto = new FormControl('');

  listaMesta: Mesto[] = [];
  popuniMesta: Observable<Mesto[]>;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor(private serviceMapa: MapeService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const pocetnaLokacija = { lng: 20.4572, lat: 44.7871, zoom: 10 };
    const kljuc = '1SGD9lbvzzGhx1JEsjnr';

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${kljuc}`,
      center: [pocetnaLokacija.lng, pocetnaLokacija.lat],
      zoom: pocetnaLokacija.zoom
    });

    this.map.addControl(new NavigationControl({}), 'top-left');

    // prikaz markera 
   var marker = new Marker({ color: "#FF0000", draggable:true })
      .setLngLat([20.4036, 44.8204])
      .addTo(this.map);

      var lngLat = marker.getLngLat();
      console.log(lngLat)
      
      // kada se prevuce marker 
      marker.on('dragend', function() {
        console.log(marker.getLngLat())})

    var scale = new ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });

    this.map.addControl(scale, 'bottom-right');

  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  //metoda vezana za autofill padajuci meni sa adresama na formi za pretragu mesta
  private _filterPokrice(naziv: string): any[] {
    const filterValue = naziv.toLowerCase();

    return this.listaMesta.filter(option => option.naziv.toLowerCase().includes(filterValue));
  }

  onEnter(){

    this.listaMesta = [];

    this.serviceMapa.pretragaMesta(this.mesto.value, '1SGD9lbvzzGhx1JEsjnr').subscribe(res => {


      for (let i = 0; i < res.features.length; i++) {

        console.log("POC")

        const element = res.features[i];
        
        let tempMesto = new Mesto;

        tempMesto = {
          koordinate: element.center,
          naziv: element.place_name
        }

        this.listaMesta.push(tempMesto);
      }

      //popunjavanje liste mesta
      this.popuniMesta = this.mesto.valueChanges.pipe(
        startWith(''),
        map(value => (typeof value === 'string' ? value : value["naziv"])),
        map(naziv => (naziv ? this._filterPokrice(naziv) : this.listaMesta.slice()))
      );

    })
  }

  selectedPlace(event){
    console.log(event)

    let long = event.koordinate[0];
    let lat = event.koordinate[1];

    console.log(event.koordinate[0])

      // prikaz markera zeljene lokacije
      var marker2 = new Marker({ color: "#FF0000", draggable:true })
      .setLngLat([long, lat])
      .addTo(this.map);

      this.map.easeTo({
        center: [long, lat],
        zoom: 15,
      })
  }

  displayPlace(option: Mesto): string {
    return option && option.naziv ? option.naziv : '';
  }

}
