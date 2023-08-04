import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl, GeolocateControl, Popup } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs';
import { Mesto } from '../Model/Mesto.model';
import { MapeService } from './mape.service';
import MapLibreGlDirections, { LoadingIndicatorControl, layersFactory } from "@maplibre/maplibre-gl-directions";
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
  // pocetak: [number, number] = [20.403737, 44.820337]
  // kraj: [number, number] = [20.403547, 44.820475]
  // brojac = 0;
  // currentMarkers=[];

  listaLokacijaZaPrikaz: any[] = [];
  listaMarkera: Marker[] = [];

  directions: MapLibreGlDirections = undefined;

  nizDistanci = []
  brojacLokacija: number = 1;

  

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
  console.log("STA SVE IME SE? ", se)
  //se je objekat koji dobija vrednosti kada se desi zadati event, tj pick - tj. odabir lokcaije iz padajuceg menija pretrage
  if (se.detail!!) {
    if (this.wayPoints.find(([k]) => k === se.detail.center[0])) {
      console.log("LOKACIJA JE VEC LISTI!");
      alert("Odabrana lokacija je vec dodata u listu lokacija!");
    }
    else {

      



      // this.wayPoints.push(se.detail.center)


      if (this.wayPoints.length == 0) {
        this.wayPoints.unshift(se.detail.center)
        this.wayPoints.push([se.detail.center[0] - 0.000003, se.detail.center[1] + +0.00003])

        var lokacijaZaPrikaz = {
          koordinate: se.detail.center,
          naziv: se.detail.place_name_sr,
          distanca: 0
        }

        this.listaLokacijaZaPrikaz.unshift(lokacijaZaPrikaz)
        this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)

      }
      else {
        this.wayPoints.splice(this.wayPoints.length - 1, 0, se.detail.center);
        this.brojacLokacija += 1;


        //prilikom dodavanja nove lokacije, proverava se da li je directions razlicito od undefined, tj dal postoji, ukoliko postoji
        //postojeca ruta se updateuje za novu lokaciju
        if (this.directions != undefined) {
          this.directions.clear();
          this.directions.destroy();
          this.directions = undefined;

          this.directions = new MapLibreGlDirections(this.map);
          this.directions.interactive = false;

          // this.wayPoints.unshift(this.pocetak);
          // this.wayPoints.push(this.kraj);
          console.log("KONACNE LOKCIJE: ", this.wayPoints)
          this.map.addControl(new LoadingIndicatorControl(this.directions));
          this.directions.setWaypoints(this.wayPoints);

        }

        // console.log("BROJAC: ", this.brojacLokacija)
        // console.log("PRVA TACKA ZA RACUN: ", this.wayPoints[this.brojacLokacija-1])
        // console.log("DRUGA TACKA ZA RACUN: ", this.wayPoints[this.brojacLokacija])

        var lokacijaZaPrikaz = {
          koordinate: se.detail.center,
          naziv: se.detail.place_name_sr,
          distanca: Number((getDistance(this.wayPoints[this.brojacLokacija-2], this.wayPoints[this.brojacLokacija-1])).toFixed(2))
        }

        

        this.listaLokacijaZaPrikaz.splice(this.listaLokacijaZaPrikaz.length - 1, 0, lokacijaZaPrikaz);

        this.listaLokacijaZaPrikaz.pop();

        var lokacijaZaPrikaz = {
          koordinate: this.listaLokacijaZaPrikaz[0].koordinate,
          naziv: this.listaLokacijaZaPrikaz[0].naziv,
          distanca: Number((getDistance(this.listaLokacijaZaPrikaz[this.brojacLokacija-1].koordinate, this.listaLokacijaZaPrikaz[0].koordinate)).toFixed(2))
        }

        console.log("NOVA POSLEDNJA TACKA: ", lokacijaZaPrikaz)

        this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)


        console.log("NIZ TACAKA: ", this.listaLokacijaZaPrikaz)
        console.log("PRVA TACKA ZA RACUN: ", this.listaLokacijaZaPrikaz[this.brojacLokacija-1].koordinate)
        console.log("DRUGA TACKA ZA RACUN: ", this.listaLokacijaZaPrikaz[0].koordinate)

        console.log(this.wayPoints[this.brojacLokacija],)
        console.log(this.wayPoints[this.brojacLokacija -1])

        console.log("LOKACIJA ZA PRIKAZ: ", lokacijaZaPrikaz)


      }

      console.log("Koordinate: ", this.wayPoints)


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
      var linkMarkera = '';
      var noviMarker = document.createElement('div');
      noviMarker.className = 'marker';

      // Set the marker's position (example coordinates)
      if (this.listaMarkera.length == 0) {
        linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/1865/1865269.png)'

      }
      else {
        linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/8587/8587894.png)'

      }

      noviMarker.style.backgroundImage = linkMarkera;
      noviMarker.style.backgroundSize = 'cover';
      noviMarker.style.width = '40px';
      noviMarker.style.height = '40px';

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



      // if (this.wayPoints[0][0] === this.pocetak[0]) {
      //   this.directions.addWaypoint(se.detail.center, this.wayPoints.length - 2)
      // }

      // console.log("PODACI MARKERA: ", oneMarker)

      this.listaMarkera.push(oneMarker);
      console.log("PODACI MARKERA: ", this.listaMarkera)

      //KADA JE MOBILNI PRIKAZ ONDA TREBA DUZE ZADRZATI KLIK I ONDA PUSTITI
      //KADA JE MOBILNI PRIKAZ ONDA TREBA DUZE ZADRZATI KLIK I ONDA PUSTITI
      noviMarker.addEventListener('contextmenu', (ma: any) => {
        // Handle the marker click event
        var markerForRemove = this.listaMarkera.indexOf(oneMarker, 0)
        console.log('MARKER ZA BRISANJE: ', markerForRemove)
        console.log(this.wayPoints)

        oneMarker.remove()
        // this.wayPoints.splice(markerForRemove + 1, 1); stari nacin brisanja

        //novi nacin uklanjanja markera iz liste wayPoints
        console.log('Marker za brisanje: ', oneMarker._lngLat.lng)
        this.wayPoints = this.wayPoints.filter(function (item) { return item[0] != oneMarker._lngLat.lng })

        //brisanje lokacije markera iz liste za pregled unetih lokacija
        if (this.listaLokacijaZaPrikaz.length > 0)
          this.listaLokacijaZaPrikaz = this.listaLokacijaZaPrikaz.filter(function (item) { return item.koordinate[0] != oneMarker._lngLat.lng })

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


      // var lokacijaZaPrikaz = {
      //   koordinate: se.detail.center,
      //   naziv: se.detail.place_name_sr
      // }

      // console.log("STA JE OBJEKAT LISTE: ", lokacijaZaPrikaz)

      // this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz);

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
// var marker = new Marker({ color: "green", draggable: true })
//   .setLngLat([20.4036, 44.8204])
//   .addTo(this.map);

// var lngLat = marker.getLngLat();
// console.log(lngLat)

// // kada se prevuce marker 
// marker.on('dragend', function () {
//   console.log(marker.getLngLat())
// })

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
  console.log("STA JE DIRECTIONS?? ", this.directions)
  if (this.directions == undefined) {
    //nema directions-a tj undefined je
    this.directions = new MapLibreGlDirections(this.map);
    this.directions.interactive = false;

    // this.wayPoints.unshift(this.pocetak);
    // this.wayPoints.push(this.kraj);
    console.log("KONACNE LOKCIJE: ", this.wayPoints)
    this.map.addControl(new LoadingIndicatorControl(this.directions));
    this.directions.setWaypoints(this.wayPoints);

    //pravimo bounds koji sluzi da izracunamo, tj. napravimo okvir rute na koji mozemo zumirati mapu svaki put kada se kreira ruta
    const bounds = new maplibregl.LngLatBounds();
    this.wayPoints.forEach(waypoint => {
      bounds.extend(waypoint);
    })


    this.map.fitBounds(bounds, {
      padding: 50,
      maxzoom: 13,
    })
    var resenje;

    // var p1 = this.wayPoints[0]
    // var p2 = this.wayPoints[1]
    // resenje = getDistance(p1, p2)
   
    for (let i = 2; i < this.wayPoints.length + +1 ; i++) {
      const element = this.wayPoints[i-1];
      const elementPre = this.wayPoints[i-2];

      var distanca2Tacke = getDistance(elementPre, element);
      this.nizDistanci.push(Number(distanca2Tacke.toFixed(2)));
    }

    console.table(this.nizDistanci);
    var ukupnaDistanca = this.getTotalDistance(this.nizDistanci)

    
    console.log(ukupnaDistanca)
    
    // console.log("P1 ", p1)
    // console.log("P2 ", p2)
    // console.log("Distanca prve dve tacke je: ", resenje);
    return;
  }
  else {
    // nije undefined tj postoji directions
    console.log("LISTA MARKERA!!!: ", this.listaMarkera)//dobijam lat koordinatu markera

    return


  }




}

getTotalDistance(niz: any[]){
  return niz.map(t => t).reduce((acc, value) => acc + value, 0)
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

  // for (let i = 2; i < this.wayPoints.length + +1 ; i++) {
  //   const element = this.wayPoints[i-1];
  //   const elementPre = this.wayPoints[i-2];

  //   var distanca2Tacke = getDistance(elementPre, element);
  //   this.nizDistanci.push(Number(distanca2Tacke.toFixed(2)));
  // }

  // console.table(this.nizDistanci);
  // var ukupnaDistanca = this.getTotalDistance(this.nizDistanci)

  // for (let i = 0; i < this.listaLokacijaZaPrikaz.length; i++) {
  //   const element = this.listaLokacijaZaPrikaz[i];
  //   element.distanca = this.nizDistanci[i];
  // }

  const dialogRef = this.dialog.open(ListaLokacijaComponent, {
    width: '1000px',
    autoFocus: true,
    disableClose: true,
    data: { lista: this.listaLokacijaZaPrikaz }
  });
  // dialogRef.afterClosed().subscribe(result => {
  //nakon klika na dugme potvrdi vraca se nova lista lokacija
  //zatim se vrsti provera da li je lista null ili nije
  //ukoliko nije, tj. ima jednu ili vise lokacija traze se lokacije koje su ostale iste, tj koje nisu obrisane 
  //lokacije koje nisu obrisane smestaju se u niz pod nazivom "podudaranja"
  //nakon toga se sklanjaju svi dodati markeri na mapu i stavljaju se novi, na osnovu lokacija iz liste podudaranja
  //nakon sto se markeri postave, kreira se nova "waypoints" lista koordinata za koje treba naci optimalnu putanju i prikazati je


  //treba proveriti kako ovo radi, nisam bas siguran kako se desi da ne napravi duplikate pocetne i krajnje lokacije 
  //jer se dodaju i na kraju ove metode i u metodi kad se klikne dugme "Pronadji"

  //Imena, izgled i raspored dugmica takodje treba srediti


  //   console.log("Preostale lokacije nakon pregleda: ", result)
  //   // console.log("Lista markera", this.listaMarkera)
  //   console.log(this.listaMarkera[1]._lngLat.lng)
  //   console.log(this.listaMarkera.length)

  //   if (result !== null) {
  //     // this.wayPoints = [];
  //     let podudaranja = result.filter(item => this.listaMarkera.indexOf(item) < 0)
  //     console.log("PODUDARANJA: ", podudaranja)
  //     console.log("LISTA MARKERA NAKON IZMENE: ", this.listaMarkera)

  //     for (let i = 0; i < this.listaMarkera.length; i++) {
  //       const element = this.listaMarkera[i];
  //       this.listaMarkera[i].remove();
  //     }

  //     this.wayPoints = [];
  //     this.listaMarkera = [];

  //     for (let i = 0; i < podudaranja.length; i++) {
  //       const element = podudaranja[i];
  //       var oneMarker = new Marker({ color: "#FF0000", draggable: false })
  //         .setLngLat(element.koordinate)
  //         .addTo(this.map);

  //       this.listaMarkera.push(oneMarker);
  //       this.wayPoints.push(element.koordinate);

  //       console.log("IZMENJENI PODACI MARKERA: ", this.listaMarkera)
  //     }
  //     // this.wayPoints.unshift(this.pocetak);
  //     // this.wayPoints.push(this.kraj);
  //     console.log("NOVA LISTA WAYPOINTAL ", this.wayPoints)

  //   }
  // });
}


clearRoute() {
  this.directions.clear();
  this.directions.destroy();
  this.directions = undefined;


}



}
function getDifference(setA, setB) {
  return new Set(
    [...setA].filter(element => !setB.has(element))
  );
}

var rad = function(x) {
  // console.log("X za radijane: ", x)
  // console.log("PI za radijane: ", Math.PI)
  // console.log("KRAJNJI RADIJANI: ", (x * Math.PI / 180))
  return x * 3.14159 / 180;
};

//lng 20, lat 40, p=[lng, lat]
var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2[1] - p1[1]);
  var dLong = rad(p2[0] - p1[0]);
  var a = Number(Math.sin(dLat / 2) * Math.sin(dLat / 2)) + Number(Math.cos(rad(p1[1])) * Math.cos(rad(p2[1]))) * Number(Math.sin(dLong / 2) * Math.sin(dLong / 2));
  //atan2 ugradjena metoda sluzi da azimut pretvori u radiane
  var c = Number(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  var d = Number(R * c);

  // console.log("P1 u metodi: ", p1)
  // console.log("P2 u metodi: ", p2)

  // console.log("dLat u metodi: ", dLat);
  // console.log("dLong u metodi: ", dLong);

  // console.log("A u metodi: ", a);
  // console.log("C u metodi: ", c);
  // console.log("D u metodi: ", d);

  return d; // returns the distance in meter
};