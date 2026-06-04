import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContenedorComponent } from './contenedor/contenedor.component';
import { authGuard } from './guards/auth.guard';
import { hasOrgGuard } from './guards/has-org.guard';

const routes: Routes = [
  // ── Alias por rol → redirigen al MFE correspondiente ──────────────────────
  { path: 'publicador', redirectTo: 'contenedor/pages/factoring/publicador-facturas', pathMatch: 'full' },
  { path: 'ofertador',  redirectTo: 'contenedor/pages/factoring/ofertador-facturas',  pathMatch: 'full' },
  { path: 'dashboard',  redirectTo: 'contenedor/pages/factoring/dashboard-facturas',  pathMatch: 'full' },
  { path: 'usuario/perfil',                     redirectTo: 'contenedor/pages/perfil',                         pathMatch: 'full' },
  { path: 'usuario/organizaciones',              redirectTo: 'contenedor/pages/organizaciones',                  pathMatch: 'full' },
  { path: 'usuario/organizaciones/nueva',        redirectTo: 'contenedor/pages/organizaciones/nueva',           pathMatch: 'full' },
  { path: 'usuario/organizaciones/:id',          redirectTo: 'contenedor/pages/organizaciones/:id',             pathMatch: 'full' },
  { path: 'usuario/organizaciones/:id/gestor',   redirectTo: 'contenedor/pages/organizaciones/:id/gestor',      pathMatch: 'full' },

  // ── Autenticación: callback PKCE + redirect a login ────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },

  // ── Sin organización (post-registro) ──────────────────────────────────────
  {
    path: 'sin-organizacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./no-organization-gate/no-organization-gate.component').then(
        m => m.NoOrganizationGateComponent
      ),
  },

  // ── Shell principal (rutas protegidas) ─────────────────────────────────────
  {
    path: 'contenedor',
    component: ContenedorComponent,
    canActivate: [authGuard, hasOrgGuard],
    loadChildren: () =>
      import('./contenedor/contenedor-routing.module').then(m => m.ContenedoRoutingModule),
  },

  // ── Otras páginas (validate, inicio) ──────────────────────────────────────
  {
    path: 'erp',
    loadChildren: () => import('./pages/pages-routing.module').then(m => m.PagesRoutingModule),
  },

  // ── Ruta raíz → redirect a login ──────────────────────────────────────────
  // { path: '', redirectTo: 'auth/redirect-to-login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

