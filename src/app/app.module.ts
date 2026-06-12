
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { PagesModule } from './pages/pages.module';
import { ContenedorModule } from './contenedor/contenedor.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  credentialsInterceptor,
  authRefreshInterceptor,
  errorInterceptor,
  CorrelationIdInterceptor,
  LOGIN_APP_URL,
} from 'shared-utils';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    PagesModule,
    ContenedorModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        authRefreshInterceptor,
        errorInterceptor,
      ])
    ),
    // CorrelationIdInterceptor sigue siendo clase-based; se mantiene hasta migración completa
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorrelationIdInterceptor,
      multi: true
    },
    // Proveer la URL del login app con el valor correcto del entorno.
    // Sin esto, el token usa window.location.origin (el portal mismo) → loop infinito al expirar sesión.
    {
      provide: LOGIN_APP_URL,
      useValue: environment.appLogin,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }

