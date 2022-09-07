import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map, sample } from 'rxjs';
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

  podaciLokacije: any;
  listaSvihLokacija: Array<any>;
  nizKoordinata2Markera: Array<any> = [];

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
    var marker = new Marker({ color: "#FF0000", draggable: true })
      .setLngLat([20.4036, 44.8204])
      .addTo(this.map);

    var lngLat = marker.getLngLat();
    console.log(lngLat)

    // kada se prevuce marker 
    marker.on('dragend', function () {
      console.log(marker.getLngLat())
    })

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

  onEnter() {

    this.listaMesta = [];

    this.serviceMapa.pretragaMesta(this.mesto.value, '1SGD9lbvzzGhx1JEsjnr', '21.286407743752136,44.38585070148767,19.705742068667632,44.56372340493189', '20.4572,44.7871').subscribe(res => {
      // console.log(res)
      this.listaSvihLokacija = res.features;

      for (let i = 0; i < res.features.length; i++) {

        console.log("POC")

        const element = res.features[i];

        let tempMesto = new Mesto;

        tempMesto = {
          koordinate: element.center,
          naziv: element.place_name,
          id: element.id
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

  selectedPlace(event) {
    console.log(event)

    const pocetnaLokacija = [20.4036, 44.8204];


    console.log(this.listaSvihLokacija)

    this.listaSvihLokacija.forEach(element => {
      if (element.id == event.id) {
        this.nizKoordinata2Markera.push(pocetnaLokacija)
        this.nizKoordinata2Markera.push(event.koordinate)
        console.log("LOKACIJE")
        console.log(this.nizKoordinata2Markera)
        // console.log(element)
        this.map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: this.nizKoordinata2Markera
            }
          }
        })

        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            "line-join": 'round',
            'line-cap': 'round'
          },
          paint: {
            "line-color": '#888',
            "line-width": 8
          }
        })
      }


    });


    let long = event.koordinate[0];
    let lat = event.koordinate[1];

    console.log(event.koordinate[0])

    // prikaz markera zeljene lokacije
    var marker2 = new Marker({ color: "#FF0000", draggable: true })
      .setLngLat([long, lat])
      .addTo(this.map);

    this.map.easeTo({
      center: [long, lat],
      zoom: 15,
      duration: 1500

    })
  }

  displayPlace(option: Mesto): string {
    return option && option.naziv ? option.naziv : '';
  }

}
