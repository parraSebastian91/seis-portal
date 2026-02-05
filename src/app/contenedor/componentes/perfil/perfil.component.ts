import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionService } from '../../../service/sesion.service';

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  dataPerfil = {
    nombre: 'Sebastian Parra',
    correo: 'parra.sebastian91@gmail.com',
    imgBase64: '',
    menu: []
  }
  constructor(private _sessionSevice: SesionService) {}

  ngOnInit(): void {
    this._sessionSevice.usuario$.subscribe(usuario => {
      this.dataPerfil.nombre = usuario.nombre;
      this.dataPerfil.correo = usuario.correo;
      this.dataPerfil.imgBase64 = usuario.base64Img;
    });
  }


}
