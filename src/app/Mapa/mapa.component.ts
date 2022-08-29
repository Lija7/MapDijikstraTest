import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Map, NavigationControl, Marker, ScaleControl, Popup, Offset, GeolocateControl } from 'maplibre-gl';
import { map, sample } from 'rxjs';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss']
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {

  map: Map | undefined;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const initialState = { lng: 20.4572, lat: 44.7871, zoom: 10 };
    const kljuc = '1SGD9lbvzzGhx1JEsjnr';

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${kljuc}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom
    });

    this.map.addControl(new NavigationControl({}), 'top-left');

   var marker = new Marker({ color: "#FF0000", draggable:true })
      .setLngLat([20.4036, 44.8204])
      .addTo(this.map);

      var lngLat = marker.getLngLat();
      console.log(lngLat)
      
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

}
