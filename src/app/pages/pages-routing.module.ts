import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { ValidateComponent } from './validate/validate.component';
import { authGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    // Callback PKCE legacy: crea la sesión con el code recibido. Sin guardia.
    path: 'validate',
    component: ValidateComponent
  },
  {
    // Ruta post-login: requiere sesión activa para no arrancar sin datos en F5.
    path: 'inicio',
    canActivate: [authGuard],
    component: InicioComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
