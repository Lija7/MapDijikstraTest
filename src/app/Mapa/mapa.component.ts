import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl, GeolocateControl, Popup } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs';
import { Mesto } from '../Model/Mesto.model';
import { MapeService } from './mape.service';
import MapLibreGlDirections, { LoadingIndicatorControl } from "@maplibre/maplibre-gl-directions";
import { GeocodingControl } from "@maptiler/geocoding-control/maplibregl";
import maplibregl from "maplibre-gl";
import { ListaLokacijaComponent } from '../ListaLokacija/lista-lokacija.component';
import { MatDialog } from '@angular/material/dialog';

// export class ListaLokacija {
//   koordinate: [number, number]
//   naziv: string
// }


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

  wayPoints: [number, number][] = [];
  pocetak: [number, number] = [20.403737, 44.820337]
  kraj: [number, number] = [20.403547, 44.820475]
  // brojac = 0;
  // currentMarkers=[];

  listaLokacijaZaPrikaz: any[] = [];
  listaMarkera: Marker[] = [];

  directions: MapLibreGlDirections = undefined;

  constructor(private serviceMapa: MapeService,
    public dialog: MatDialog) { }

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

    //ovde se desava odabir pretrazene lokacije i dodavanje iste u listu koja se koristi kasnije za prikaz krajnje rute
    const gc = new GeocodingControl({ apiKey: kljuc, enableReverse: true, country: 'rs', reverseButtonTitle: 'Odaberi lokaciju na mapi', marker: true, minLength: 4, showFullGeometry: true, placeholder: 'Lokacija' });
    gc.addEventListener("pick", (se: any) => {
      // console.log(se.detail.center)

      // directions.interactive = true;
      const pocetak: [number, number] = [pocetnaLokacija.lng, pocetnaLokacija.lat]

      //se je objekat koji dobija vrednosti kada se desi zadati event, tj pick - tj. odabir lokcaije iz padajuceg menija pretrage
      if (se.detail!!) {
        if (this.wayPoints.find(([k]) => k === se.detail.center[0])) {
          console.log("LOKACIJA JE VEC LISTI!");
          alert("Odabrana lokacija je vec dodata u listu lokacija!");
        }
        else {
          this.wayPoints.push(se.detail.center)
          // console.log("Sta sve u sebi ima se: ", se.detail.place_name_sr)

          // this.brojac += 1;
          // var imePromenjive = 'markerListe' + this.brojac as any
          // var popup = new Popup({ offset: 25 }).setText(
          //   "Naziv lokacije: " + se.detail.place_name_sr + " \n\n\n " +
          //   "\nKoordinate lokacije: " + se.detail.center
          // );

          // var oneMarker = new Marker({ color: "#FF0000", draggable: false })
          //   .setLngLat(se.detail.center)
          //   .setPopup(popup)
          //   .addTo(this.map);

          var noviMarker = document.createElement('div');
          noviMarker.className = 'marker';

          // Set the marker's position (example coordinates)

          noviMarker.style.backgroundImage = 'url(https://icons.iconarchive.com/icons/paomedia/small-n-flat/256/map-marker-icon.png)';
          noviMarker.style.backgroundSize = 'cover';
          noviMarker.style.width = '30px';
          noviMarker.style.height = '30px';

          var popup = new Popup({ offset: 25 }).setText(
            "Naziv lokacije: " + se.detail.place_name_sr + " \n\n\n " +
            "\nKoordinate lokacije: " + se.detail.center
          );
          popup.setHTML("Naziv lokacije: " + se.detail.place_name_sr + " \n\n\n " +
          "\nKoordinate lokacije: " + se.detail.center);

          // Add the marker to the map
          var oneMarker = new Marker(noviMarker)
            .setLngLat(se.detail.center)
            .addTo(this.map)
            .setPopup(popup)



          if (this.wayPoints[0][0] === this.pocetak[0]) {
            this.directions.addWaypoint(se.detail.center, this.wayPoints.length - 2)
          }

          // console.log("PODACI MARKERA: ", oneMarker)

          this.listaMarkera.push(oneMarker);
          console.log("PODACI MARKERA: ", this.listaMarkera)

          //KADA JE MOBILNI PRIKAZ ONDA TREBA DUZE ZADRZATI KLIK I ONDA PUSTITI
          noviMarker.addEventListener('contextmenu', (ma: any) => {
            // Handle the marker click event
            var markerForRemove = this.listaMarkera.indexOf(oneMarker, 0)
            console.log(markerForRemove)
            console.log(this.wayPoints)

            oneMarker.remove()
            this.wayPoints.splice(markerForRemove + 1, 1);


            this.map.addControl(new LoadingIndicatorControl(this.directions));
            this.directions.removeWaypoint(markerForRemove + 1);

          });

          
          noviMarker.addEventListener('mouseenter', (ma: any) => {
            noviMarker.classList.add('hover');
            popup.addTo(this.map);
          });

          // Hide the popup when the mouse leaves the marker
          noviMarker.addEventListener('mouseleave', (ma: any) => {
            noviMarker.classList.remove('hover');
            popup.remove();
          });


          var lokacijaZaPrikaz = {
            koordinate: se.detail.center,
            naziv: se.detail.place_name_sr
          }

          console.log("STA JE OBJEKAT LISTE: ", lokacijaZaPrikaz)

          this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz);

          console.log("STA JE U LISTI: ", this.listaLokacijaZaPrikaz)


          // this.currentMarkers.push(oneMarker);
          // console.log(imePromenjive);
          // imePromenjive.on('clikc', function(){
          //   console.log("LOKACIJA MARKERA JE: ", imePromenjive.getLngLat())
          // })
        }
      }
      else {
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
    var marker = new Marker({ color: "green", draggable: true })
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
    const pocetnaLokacija: [number, number] = [20.4036, 44.8204];

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

  pretraziLokacije() {
    if (this.directions == undefined) {
      //nema directions-a tj undefined je
      this.directions = new MapLibreGlDirections(this.map);
      this.directions.interactive = true;

      this.wayPoints.unshift(this.pocetak);
      this.wayPoints.push(this.kraj);
      console.log("KONACNE LOKCIJE: ", this.wayPoints)
      this.map.addControl(new LoadingIndicatorControl(this.directions));
      this.directions.setWaypoints(this.wayPoints);
      return;
    }
    else {
      //nije undefined tj postoji directions
      console.log("LISTA MARKERA!!!: ", this.listaMarkera)//dobijam lat koordinatu markera

      return
    }




  }

  // obrisiPoslenjdiMarker(marker){
  //   if (this.currentMarkers!==null) {
  //     for (var i = this.currentMarkers.length - 1; i >= 0; i--) {
  //       this.currentMarkers[i].remove();
  //     }
  //   }
  // }

  //otvara se modal sa listom odabranih lokacija gde je moguce izbrisati neke od lokacije sa liste, klikom na zeljenu lokaciju
  openListView() {

    const dialogRef = this.dialog.open(ListaLokacijaComponent, {
      width: '1000px',
      autoFocus: true,
      disableClose: true,
      data: { lista: this.listaLokacijaZaPrikaz, markeri: this.listaMarkera }
    });
    dialogRef.afterClosed().subscribe(result => {
      //nakon klika na dugme potvrdi vraca se nova lista lokacija
      //zatim se vrsti provera da li je lista null ili nije
      //ukoliko nije, tj. ima jednu ili vise lokacija traze se lokacije koje su ostale iste, tj koje nisu obrisane 
      //lokacije koje nisu obrisane smestaju se u niz pod nazivom "podudaranja"
      //nakon toga se sklanjaju svi dodati markeri na mapu i stavljaju se novi, na osnovu lokacija iz liste podudaranja
      //nakon sto se markeri postave, kreira se nova "waypoints" lista koordinata za koje treba naci optimalnu putanju i prikazati je


      //treba proveriti kako ovo radi, nisam bas siguran kako se desi da ne napravi duplikate pocetne i krajnje lokacije 
      //jer se dodaju i na kraju ove metode i u metodi kad se klikne dugme "Pronadji"

      //Imena, izgled i raspored dugmica takodje treba srediti


      console.log("Preostale lokacije nakon pregleda: ", result)
      // console.log("Lista markera", this.listaMarkera)
      console.log(this.listaMarkera[1]._lngLat.lng)
      console.log(this.listaMarkera.length)

      if (result !== null) {
        // this.wayPoints = [];
        let podudaranja = result.filter(item => this.listaMarkera.indexOf(item) < 0)
        console.log("PODUDARANJA: ", podudaranja)
        console.log("LISTA MARKERA NAKON IZMENE: ", this.listaMarkera)

        for (let i = 0; i < this.listaMarkera.length; i++) {
          const element = this.listaMarkera[i];
          this.listaMarkera[i].remove();
        }

        this.wayPoints = [];
        this.listaMarkera = [];

        for (let i = 0; i < podudaranja.length; i++) {
          const element = podudaranja[i];
          var oneMarker = new Marker({ color: "#FF0000", draggable: false })
            .setLngLat(element.koordinate)
            .addTo(this.map);

          this.listaMarkera.push(oneMarker);
          this.wayPoints.push(element.koordinate);

          console.log("IZMENJENI PODACI MARKERA: ", this.listaMarkera)
        }
        this.wayPoints.unshift(this.pocetak);
        this.wayPoints.push(this.kraj);
        console.log("NOVA LISTA WAYPOINTAL ", this.wayPoints)

      }
    });
  }



}
function getDifference(setA, setB) {
  return new Set(
    [...setA].filter(element => !setB.has(element))
  );
}