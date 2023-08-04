import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ListaLokacija } from '../Model/listaLokacija.model';

@Component({
  selector: 'app-lista-lokacija',
  templateUrl: './lista-lokacija.component.html',
  styleUrls: ['./lista-lokacija.component.scss']
})
export class ListaLokacijaComponent implements OnInit {


  dataSourceListaLokacija: MatTableDataSource<ListaLokacija>;
  columnsToDisplay = ['naziv', 'distanca'];


  constructor(private dialogRef: MatDialogRef<ListaLokacijaComponent>,
    @Inject(MAT_DIALOG_DATA) public data) { }


  ngOnInit(): void {
    console.log("DATA: ", this.data)
    this.dataSourceListaLokacija = new MatTableDataSource(this.data.lista)
  }

  onNoClick() {
    this.dialogRef.close();
  }

  potvrdiUnos() {
    this.dialogRef.beforeClosed().subscribe(() => this.dialogRef.close(this.data.lista));
    this.dialogRef.close();
  }

  obrisiLokaciju(detalj, i) {
    this.data.lista.splice(i ,1);
    this.dataSourceListaLokacija = new MatTableDataSource(this.data.lista)

  }

  getTotalCost(){
    return this.data.lista.map(t => t.distanca).reduce((acc, value) => acc + value, 0);
  }

}
