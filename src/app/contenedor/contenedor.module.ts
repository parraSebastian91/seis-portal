/*
https://docs.nestjs.com/modules
*/

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ContenedorComponent } from './contenedor.component';
import { PerfilComponent } from './componentes/perfil/perfil.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { PagesModule } from '../pages/pages.module';
import { ContenedoRoutingModule } from './contenedor-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MenuComponent } from './componentes/menu/menu.component';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import {MatBadgeModule} from '@angular/material/badge';
@NgModule({
  declarations: [
    ContenedorComponent,
    MenuComponent,
    NavbarComponent,
    PerfilComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatToolbarModule,
    MatSidenavModule,
    MatBadgeModule,
    ContenedoRoutingModule,
    PagesModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContenedorModule {}
