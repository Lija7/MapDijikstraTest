import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MapeService {

  constructor(private http: HttpClient) { }

  search(upit:string, kljuc:string){
    this.http.get('https://api.maptiler.com/geocoding/[' + upit + '].json?key=' + kljuc);
  }
}
