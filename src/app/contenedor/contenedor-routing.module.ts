import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';


// loadRemoteModule('[NOMBRE EXPUESTO]', '[CAVE DE LA PROPIEDAD "exposes" EN EL REMOTE]')
//         .then(m => m.[MÓDULO QUE SE QUIERE CARGAR])

const routes: Routes = [
  {
    path: 'pages/factoring/dashboard-facturas',
    loadChildren: () =>
      loadRemoteModule('seis-mfe-dashboard-facturas', './DashboardFacturasRoutingModule')
        .then(m => m.DashboardFacturasRoutingModule)
  },
  {
    path: 'pages/factoring/publicador-facturas',
    loadChildren: () =>
      loadRemoteModule('seis-mfe-publicador-facturas', './PublicadorFacturasRoutingModule')
        .then(m => m.PublicadorFacturasRoutingModule)
  },
  {
    path: 'pages',
    loadChildren: () =>
      loadRemoteModule('seis-mfe-gestion-usuario', './UserProfileRoutingModule')
        .then(m => m.UserProfileRoutingModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContenedoRoutingModule { }
