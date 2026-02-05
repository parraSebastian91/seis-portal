import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'contenedor',
    loadChildren: () => import('./contenedor/contenedor-routing.module').then(m => m.ContenedoRoutingModule)
  },
  {
    path: 'erp',
    loadChildren: () => import('./pages/pages-routing.module').then(m => m.PagesRoutingModule)
  },
  // Wildcard route must be last — redirect unknown paths to the validate screen
  { path: '**', redirectTo: 'erp/validate', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
