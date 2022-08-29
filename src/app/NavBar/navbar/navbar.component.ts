import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  mesto = new FormControl('')
  filteredOptions: any = []

  constructor() { }

  ngOnInit(): void {
    // this.filteredOptions = this.mesto.valueChanges.pipe(
    
  }


}
