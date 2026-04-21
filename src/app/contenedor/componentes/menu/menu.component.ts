import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionService } from '../../../service/sesion.service';
import { Router } from '@angular/router';
import { AppTheme, ThemeService } from 'shared-utils';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PerfilComponent } from '../perfil/perfil.component';
import { ISidebarMenu } from 'shared-utils/lib/services/types/SidebarMenu.type';

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  menus: ISidebarMenu[] = [] as ISidebarMenu[];

  theme: AppTheme = {
    primary: '#1976d2',
    secondary: '#1976d2',
    accent: '#ff4081',
    onFocus: '#1976d2',
    warn: '#f44336',
    background: '#ffffff',
    onPrimary: '#ffffff'
  };


  constructor(
    private _sesionService: SesionService,
    private _router: Router,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
  }

  navegar(ruta: string): void {
    console.log('navegar', ruta);
    this._router.navigate([ruta]);
  }
}
