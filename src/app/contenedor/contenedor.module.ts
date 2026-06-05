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
import { TopNavbarComponent } from './componentes/top-navbar/top-navbar.component';
import { ModalUploadObjectComponent } from './componentes/modal-upload-object/modal-upload-object.component';
import { RouterModule } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { SearchableCardSelectComponent } from 'shared-utils';
import { OrganizationSelectorComponent } from './componentes/top-navbar/organization-selector/organization-selector.component';
import { NotificationsSidebarComponent } from './componentes/notifications-sidebar/notifications-sidebar.component';
import { AppDrawerComponent } from './componentes/app-drawer/app-drawer.component';

@NgModule({
  declarations: [
    ContenedorComponent,
    MenuComponent,
    NavbarComponent,
    TopNavbarComponent,
    PerfilComponent,
    ModalUploadObjectComponent
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
    PagesModule,
    SearchableCardSelectComponent,
    OrganizationSelectorComponent,
    NotificationsSidebarComponent,
    AppDrawerComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContenedorModule {}
