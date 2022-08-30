import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapeService {

  constructor(private http: HttpClient) { }

pretragaMesta(upit:string, kljuc:string): Observable<any>{

    return this.http.get('https://api.maptiler.com/geocoding/[' + upit + '].json?key=' + kljuc);
    
  }
}
