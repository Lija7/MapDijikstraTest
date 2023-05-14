import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl, GeolocateControl } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs';
import { Mesto } from '../Model/Mesto.model';
import { MapeService } from './mape.service';
import MapLibreGlDirections, { LoadingIndicatorControl } from "@maplibre/maplibre-gl-directions";
import { GeocodingControl } from "@maptiler/geocoding-control/maplibregl";
import maplibregl from "maplibre-gl";


@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {

  map: Map | any | undefined;

  mesto = new FormControl('');

  listaMesta: Mesto[] = [];
  popuniMesta: Observable<Mesto[]>;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  podaciLokacije: any;
  listaSvihLokacija: Array<any>;
  nizKoordinata2Markera: Array<any> = [];

  wayPoints: [number,number][] = [];
  pocetak: [number, number] = [20.403737,44.820337]
  kraj: [number, number] = [20.403547,44.820475]

  constructor(private serviceMapa: MapeService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const pocetnaLokacija = { lng: 20.4572, lat: 44.7871, zoom: 10 };
    const kljuc = '1SGD9lbvzzGhx1JEsjnr';


    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${kljuc}`,
      center: [pocetnaLokacija.lng, pocetnaLokacija.lat],
      zoom: pocetnaLokacija.zoom
    });

    this.map.addControl(new NavigationControl({}), 'top-left');
    
    const gc = new GeocodingControl({apiKey: kljuc, enableReverse: true, country:'rs', reverseButtonTitle: 'Odaberi lokaciju na mapi', marker: true,  minLength: 4, showFullGeometry: true, placeholder: 'Lokacija'});
    gc.addEventListener("pick", (se:any)=> {
      // console.log(se.detail.center)

      // directions.interactive = true;
      const pocetak: [number, number] = [pocetnaLokacija.lng, pocetnaLokacija.lat]


    if(se.detail !!){
      if (this.wayPoints.find(([k]) => k === se.detail.center[0])){
        console.log("LOKACIJA JE VEC LISTI!");
      }
      else{
        this.wayPoints.push(se.detail.center)
      }
    }
    else{
      this.wayPoints = this.wayPoints
    }


      console.log("Sve lokacije: ", this.wayPoints)
  
        // this.map.addControl(new LoadingIndicatorControl(this.directions));
        // directions.clear();
        // directions.setWaypoints(
        //   wayPoints
        // );
        // this.directions.waypoints.push(se.detail.center)


    })
    this.map.addControl(gc, 'top-right');
    this.map.addControl(new GeolocateControl({}), 'top-right');

  
    // prikaz markera 
    var marker = new Marker({ color: "#FF0000", draggable: true})
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

    // this.map.on('load', ()=>{
    //   const directions = new MapLibreGlDirections(this.map);

    //   directions.interactive = true;

    //   this.map.addControl(new LoadingIndicatorControl(directions));
    //   directions.setWaypoints([
    //     [20.4036, 44.8204],
    //     [20.4591, 44.8238],
    //   ]);
    // })

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

    this.nizKoordinata2Markera = []
    const pocetnaLokacija : [number, number] = [20.4036, 44.8204];

    const directions = new MapLibreGlDirections(this.map);
    
    console.log(this.listaSvihLokacija)

    this.listaSvihLokacija.forEach(element => {
      if (element.id == event.id) {
        this.nizKoordinata2Markera.push(pocetnaLokacija)
        this.nizKoordinata2Markera.push(event.koordinate)
        console.log("LOKACIJE")
        console.log(this.nizKoordinata2Markera)

        

        directions.interactive = true;
  
        this.map.addControl(new LoadingIndicatorControl(directions));
        directions.setWaypoints([
          pocetnaLokacija,
          event.koordinate,
        ]);

        // console.log(element)
        // this.map.addSource('route' + event.koordinate[0], {
        //   type: 'geojson',
        //   data: {
        //     type: 'Feature',
        //     properties: {},
        //     geometry: {
        //       type: 'LineString',
        //       coordinates: this.nizKoordinata2Markera
        //     }
        //   }
        // })

        // this.map.addLayer({
        //   id: 'route'+ event.koordinate[0],
        //   type: 'line',
        //   source: 'route' + event.koordinate[0],
        //   layout: {
        //     "line-join": 'round',
        //     'line-cap': 'round'
        //   },
        //   paint: {
        //     "line-color": '#888',
        //     "line-width": 8
        //   }
        // })
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

  pretraziLokacije(){
    const directions = new MapLibreGlDirections(this.map);
    directions.interactive = true;

    this.wayPoints.unshift(this.pocetak);
    this.wayPoints.push(this.kraj);
    console.log("KONACNE LOKCIJE: ", this.wayPoints)
    this.map.addControl(new LoadingIndicatorControl(directions));
        directions.setWaypoints(this.wayPoints);

  }

}
