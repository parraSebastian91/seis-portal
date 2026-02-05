import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

const routes: Routes = [
  {
    path: 'pages',
    loadChildren: () =>
      loadRemoteModule('seis-mfe-gestion-usuario', './AppRoutingModule')
        .then(m => m.AppRoutingModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContenedoRoutingModule { }
