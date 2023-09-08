import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Map, NavigationControl, Marker, ScaleControl, GeolocateControl, Popup, LngLat } from 'maplibre-gl';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs';
import { Mesto } from '../Model/Mesto.model';
import { MapeService } from './mape.service';
import MapLibreGlDirections, { LoadingIndicatorControl, layersFactory } from "@maplibre/maplibre-gl-directions";
import { GeocodingControl } from "@maptiler/geocoding-control/maplibregl";
import maplibregl from "maplibre-gl";
import { ListaLokacijaComponent } from '../ListaLokacija/lista-lokacija.component';
import { MatDialog } from '@angular/material/dialog';
import { Route, Router } from '@angular/router';
import  SerbianLatinCyrillicTranslateration from 'serbian-latin-cyrillic-transliteration'


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

  listaLokacijaZaPrikaz: any[] = [];
  listaMarkera: Marker[] = [];

  directions: MapLibreGlDirections = undefined;

  nizDistanci = []
  brojacLokacija: number = 1;


  constructor(public serviceMapa: MapeService,
    public dialog: MatDialog,
    private router: Router) { }

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
    var geolocate = new maplibregl.GeolocateControl({});

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


            //provera da li je geolocation control ukljucen, ako je ukljucen prilikom dodavanja prve lokacije, unetu lokaciju treba dodati kao drugu, a za prvu
            //tj pocetnu i krajnju lokaciju treba odabrati lokaciju geolocation-a

            console.log("STA IMA GEOLOCATE? ", geolocate)
            if (geolocate._userLocationDotMarker._lngLat != undefined || geolocate._userLocationDotMarker._lngLat != null) {

              var pomocna = [geolocate._userLocationDotMarker._lngLat.lng.toFixed(6), geolocate._userLocationDotMarker._lngLat.lat.toFixed(6)]
              console.log("DAL ZNAS DA ZAOKRUZIS? ", pomocna)
              console.log("GEOLOCATE JE UKLJUCEN")
              this.wayPoints.unshift([Number(pomocna[0]), Number(pomocna[1])])
              this.wayPoints.push([Number(pomocna[0]) - Number(0.00003), Number(pomocna[1]) + Number(0.00003)])

              this.serviceMapa.obrnutiGeokoding(geolocate._userLocationDotMarker._lngLat.lng, geolocate._userLocationDotMarker._lngLat.lat).subscribe(res => {
                // console.log("STA IMA U RES OD OBRNUTOG GEOKODINGA? ", res)
                
                var lokacijaZaPrikaz = {
                  koordinate: [geolocate._userLocationDotMarker._lngLat.lng, geolocate._userLocationDotMarker._lngLat.lat] as any,
                  naziv: res.features[0].place_name_sr,
                  distanca: 0
                }

                this.listaLokacijaZaPrikaz.unshift(lokacijaZaPrikaz)
                this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)

                this.wayPoints.splice(this.wayPoints.length - 1, 0, se.detail.center);
                this.brojacLokacija += 1;

                var lokacijaZaPrikaz = {
                  koordinate: se.detail.center,
                  naziv: se.detail.place_name_sr,
                  distanca: Number((getDistance(this.wayPoints[this.brojacLokacija - 2], this.wayPoints[this.brojacLokacija - 1])).toFixed(2))
                }

                this.listaLokacijaZaPrikaz.splice(this.listaLokacijaZaPrikaz.length - 1, 0, lokacijaZaPrikaz);

                this.listaLokacijaZaPrikaz.pop();

                var lokacijaZaPrikaz = {
                  koordinate: this.listaLokacijaZaPrikaz[0].koordinate,
                  naziv: this.listaLokacijaZaPrikaz[0].naziv,
                  distanca: Number((getDistance(this.listaLokacijaZaPrikaz[this.brojacLokacija - 1].koordinate, this.listaLokacijaZaPrikaz[0].koordinate)).toFixed(2))
                }

                console.log("NOVA POSLEDNJA TACKA: ", lokacijaZaPrikaz)

                this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)
                

                var linkMarkera = '';
                var noviMarker = document.createElement('div');
                noviMarker.className = 'marker';

                // Set the marker's position (example coordinates)
                if (this.listaMarkera.length == 1) {
                  linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/143/143960.png)'

                }
                else {
                  linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/8587/8587894.png)'

                }

                noviMarker.style.backgroundImage = linkMarkera;
                noviMarker.style.backgroundSize = 'cover';
                noviMarker.style.width = '40px';
                noviMarker.style.height = '40px';

                var popup = new Popup({ offset: 25 }).setText(
                  "<span style='font-weight: bold; font-size: 14px'>" + "Naziv lokacije: " + "</span> <br>" + res.features[0].place_name_sr + " \n\n\n " +
                  "<br> <span style='font-weight: bold; font-size: 14px'> Koordinate lokacije: </span>" + [geolocate._userLocationDotMarker._lngLat.lng, geolocate._userLocationDotMarker._lngLat.lat] as any
                );
                popup.setHTML("<span style='font-weight: bold; font-size: 14px'> Naziv lokacije: </span> <br>" + res.features[0].place_name_sr + " \n\n\n " +
                  "<br> <span style='font-weight: bold; font-size: 14px'> Koordinate lokacije: </span>" + [geolocate._userLocationDotMarker._lngLat.lng, geolocate._userLocationDotMarker._lngLat.lat] as any);

                // Add the marker to the map
                var oneMarker = new Marker(noviMarker)
                  .setLngLat([geolocate._userLocationDotMarker._lngLat.lng, geolocate._userLocationDotMarker._lngLat.lat] as any)
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
                  // console.log(this.wayPoints[0][0])
                  // console.log(oneMarker._lngLat.lng)
                  if (this.wayPoints[0][0] == oneMarker._lngLat.lng) {
                    alert("Nije dozvoljeno brisanje pocetne lokacije!")
                    return;
                  }
                  else {

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

                    // this.map.addControl(new LoadingIndicatorControl(this.directions));
                    // this.directions.removeWaypoint(markerForRemove + 1);

                  }





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
              })




            }
            else {
              console.log("GEOLOCATE JE ISKLJUCEN")
              this.wayPoints.unshift(se.detail.center)
              this.wayPoints.push([Number(se.detail.center[0]) - Number(0.00003), Number(se.detail.center[1]) + Number(0.00003)])

              var lokacijaZaPrikaz = {
                koordinate: se.detail.center,
                naziv: se.detail.place_name_sr,
                distanca: 0
              }

              this.listaLokacijaZaPrikaz.unshift(lokacijaZaPrikaz)
              this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)
            }





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
              distanca: Number((getDistance(this.wayPoints[this.brojacLokacija - 2], this.wayPoints[this.brojacLokacija - 1])).toFixed(2))
            }

            this.listaLokacijaZaPrikaz.splice(this.listaLokacijaZaPrikaz.length - 1, 0, lokacijaZaPrikaz);

            this.listaLokacijaZaPrikaz.pop();

            var lokacijaZaPrikaz = {
              koordinate: this.listaLokacijaZaPrikaz[0].koordinate,
              naziv: this.listaLokacijaZaPrikaz[0].naziv,
              distanca: Number((getDistance(this.listaLokacijaZaPrikaz[this.brojacLokacija - 1].koordinate, this.listaLokacijaZaPrikaz[0].koordinate)).toFixed(2))
            }

            console.log("NOVA POSLEDNJA TACKA: ", lokacijaZaPrikaz)

            this.listaLokacijaZaPrikaz.push(lokacijaZaPrikaz)


            console.log("NIZ TACAKA: ", this.listaLokacijaZaPrikaz)
            console.log("PRVA TACKA ZA RACUN: ", this.listaLokacijaZaPrikaz[this.brojacLokacija - 1].koordinate)
            console.log("DRUGA TACKA ZA RACUN: ", this.listaLokacijaZaPrikaz[0].koordinate)

            console.log(this.wayPoints[this.brojacLokacija],)
            console.log(this.wayPoints[this.brojacLokacija - 1])

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

          if(geolocate._userLocationDotMarker._lngLat != undefined || geolocate._userLocationDotMarker._lngLat != null){
            if (this.listaMarkera.length == 1) {
              linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/143/143960.png)'
  
            }
            else {
              linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/8587/8587894.png)'
  
            }
          }
          else{
            if (this.listaMarkera.length == 0) {
              linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/143/143960.png)'
  
            }
            else {
              linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/8587/8587894.png)'
  
            }
          }
          // Set the marker's position (example coordinates)
          

          noviMarker.style.backgroundImage = linkMarkera;
          noviMarker.style.backgroundSize = 'cover';
          noviMarker.style.width = '40px';
          noviMarker.style.height = '40px';

          var popup = new Popup({ offset: 25 }).setText(
            "<span style='font-weight: bold; font-size: 14px'>" + "Naziv lokacije: " + "</span> <br>" + se.detail.place_name_sr + " \n\n\n " +
            "<br> <span style='font-weight: bold; font-size: 14px'> Koordinate lokacije: </span>" + se.detail.center
          );
          popup.setHTML("<span style='font-weight: bold; font-size: 14px'>"+"Naziv lokacije: " + "</span> <br>" + se.detail.place_name_sr + " \r\n\n\n " +
            "<br> <span style='font-weight: bold; font-size: 14px'> Koordinate lokacije: </span>" + se.detail.center);

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
            // console.log(this.wayPoints[0][0])
            // console.log(oneMarker._lngLat.lng)
            if (this.wayPoints[0][0] == oneMarker._lngLat.lng) {
              alert("Nije dozvoljeno brisanje pocetne lokacije!")
              return;
            }
            else {

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

              // this.map.addControl(new LoadingIndicatorControl(this.directions));
              // this.directions.removeWaypoint(markerForRemove + 1);

            }





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



    })


    this.map.addControl(gc, 'top-right');

    this.map.addControl(geolocate, 'top-right');
    //ne moze vise od 15, tolko je i pod defaultu, jer je namesteno da fituje granice, 
    //ako mu se nekako iskljuci to onda ce vrv moci veci zoom
    geolocate.options.fitBoundsOptions.maxZoom = 15;
    var pomocniSerivs = this.serviceMapa
    //dodagadjaj dodavanja geolocate controla na mapu
    geolocate.on('geolocate', function (e) {
      var lon = e.coords.longitude;
      var lat = e.coords.latitude
      var position = [lon, lat];
      console.log("Pozicija geolocatea: ", e);


      //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

      //dodaje se kod da se na lokaciju geolocate controlla doda pocetni marker i da se za taj marker napravi popup
      //takodje u listu lokacija i u waypoints na pocetak i kraj ubacije se lokacija geolocate controla

      // var linkMarkera = 'url(https://cdn-icons-png.flaticon.com/512/1865/1865269.png)'
      // var noviMarker = document.createElement('div');
      //     noviMarker.className = 'marker';

      // var nesto = new maplibregl.Marker().setLngLat(position as [number, number])

      // pomocniSerivs.obrnutiGeokoding().subscribe(res=>{
      //   let geokoder = res['features'][0]['geometry']['coordinates']
      //   console.log("DAL MOZE I OVAKO MOZDA? ", geokoder)


      //   noviMarker.style.backgroundImage = linkMarkera;
      //   noviMarker.style.backgroundSize = 'cover';
      //   noviMarker.style.width = '40px';
      //   noviMarker.style.height = '40px';

      //   var popup = new Popup({ offset: 25 }).setText(
      //     "Naziv lokacije: " + res.features[0].place_name_sr + " \n\n\n " +
      //     "\nKoordinate lokacije: " + position
      //   );
      //   popup.setHTML("Naziv lokacije: " + res.features[0].place_name_sr + " \n\n\n " +
      //     "\nKoordinate lokacije: " + position);

      //   // Add the marker to the map

      //   var oneMarker = new Marker(noviMarker)
      //   .setLngLat(this.position)
      //   .addTo(this.map)
      //   .setPopup(popup)

      //     this.listaMarkera.push(oneMarker);
      //     console.log("PODACI MARKERA: ", this.listaMarkera)

      //     //KADA JE MOBILNI PRIKAZ ONDA TREBA DUZE ZADRZATI KLIK I ONDA PUSTITI
      //     //KADA JE MOBILNI PRIKAZ ONDA TREBA DUZE ZADRZATI KLIK I ONDA PUSTITI
      //     noviMarker.addEventListener('contextmenu', (ma: any) => {
      //       // Handle the marker click event
      //       // console.log(this.wayPoints[0][0])
      //       // console.log(oneMarker._lngLat.lng)
      //       if (this.wayPoints[0][0] == oneMarker._lngLat.lng) {
      //         alert("Nije dozvoljeno brisanje pocetne lokacije!")
      //         return;
      //       }
      //       else {

      //         var markerForRemove = this.listaMarkera.indexOf(oneMarker, 0)
      //         console.log('MARKER ZA BRISANJE: ', markerForRemove)
      //         console.log(this.wayPoints)

      //         oneMarker.remove()
      //         // this.wayPoints.splice(markerForRemove + 1, 1); stari nacin brisanja

      //         //novi nacin uklanjanja markera iz liste wayPoints
      //         console.log('Marker za brisanje: ', oneMarker._lngLat.lng)
      //         this.wayPoints = this.wayPoints.filter(function (item) { return item[0] != oneMarker._lngLat.lng })

      //         //brisanje lokacije markera iz liste za pregled unetih lokacija
      //         if (this.listaLokacijaZaPrikaz.length > 0)
      //           this.listaLokacijaZaPrikaz = this.listaLokacijaZaPrikaz.filter(function (item) { return item.koordinate[0] != oneMarker._lngLat.lng })

      //         // this.map.addControl(new LoadingIndicatorControl(this.directions));
      //         // this.directions.removeWaypoint(markerForRemove + 1);

      //       }
      //     });


      //     noviMarker.addEventListener('mouseenter', (ma: any) => {
      //       noviMarker.classList.add('hover');
      //       popup.addTo(this.map);
      //     });

      //     // Hide the popup when the mouse leaves the marker
      //     noviMarker.addEventListener('mouseleave', (ma: any) => {
      //       noviMarker.classList.remove('hover');
      //       popup.remove();
      //     });


      // })


    });

    var scale = new ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    });


    this.map.addControl(scale, 'bottom-right');
  }

  // 
  ngOnDestroy(): void {
    this.map?.remove();
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

  pretraziLokacije() {

    console.log("KOLIKO IMA LOKACIJE? ", this.wayPoints.length)
    if (this.wayPoints.length === 2) {
      alert("Nije moguće generisati rutu samo za jednu lokaciju!")
      return
    }

    console.log("STA JE DIRECTIONS?? ", this.directions)
    if (this.directions == undefined) {
      //nema directions-a tj undefined je
      this.directions = new MapLibreGlDirections(this.map);
      this.directions.interactive = false;

      // this.wayPoints.unshift(this.pocetak);
      // this.wayPoints.push(this.kraj);
      console.log("KONACNE LOKCIJE: ", this.wayPoints)
      this.map.addControl(new LoadingIndicatorControl(this.directions));

      // this.wayPoints =[
      //   [
      //       20.453786,
      //       44.757811
      //   ],
      //   [
      //       20.494952,
      //       44.775572
      //   ],
      //   [
      //       20.408508,
      //       44.783758
      //   ],
      //   [
      //       20.453756,
      //       44.757841
      //   ]]

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

      for (let i = 2; i < this.wayPoints.length + +1; i++) {
        const element = this.wayPoints[i - 1];
        const elementPre = this.wayPoints[i - 2];

        var distanca2Tacke = getDistance(elementPre, element);
        this.nizDistanci.push(Number(distanca2Tacke.toFixed(2)));
      }

      console.table(this.nizDistanci);
      var ukupnaDistanca = this.getTotalDistance(this.nizDistanci)


      console.log(ukupnaDistanca)
      return;
    }
    else {
      // nije undefined tj postoji directions
      console.log("LISTA MARKERA!!!: ", this.listaMarkera)//dobijam lat koordinatu markera

      return;
    }
  }


  getTotalDistance(niz: any[]) {
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


    const dialogRef = this.dialog.open(ListaLokacijaComponent, {
      width: '1000px',
      autoFocus: true,
      disableClose: true,
      data: { lista: this.listaLokacijaZaPrikaz }
    });

  }


  clearRoute() {
    this.directions.clear();
    this.directions.destroy();
    this.directions = undefined;
  }

  brisanjeRute() {
    window.location.reload();
  }
}

function getDifference(setA, setB) {
  return new Set(
    [...setA].filter(element => !setB.has(element))
  );
}

var rad = function (x) {
  // console.log("X za radijane: ", x)
  // console.log("PI za radijane: ", Math.PI)
  // console.log("KRAJNJI RADIJANI: ", (x * Math.PI / 180))
  return x * 3.14159 / 180;
};

//lng 20, lat 40, p=[lng, lat]
var getDistance = function (p1, p2) {
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