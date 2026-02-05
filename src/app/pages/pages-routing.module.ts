import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { ValidateComponent } from './validate/validate.component';

const routes: Routes = [
  {
    path: 'validate',
    component: ValidateComponent
  },
  {
    path: 'inicio',
    component: InicioComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
