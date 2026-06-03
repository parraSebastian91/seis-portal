
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { PagesModule } from './pages/pages.module';
import { ContenedorModule } from './contenedor/contenedor.module';
import {
  credentialsInterceptor,
  authRefreshInterceptor,
  errorInterceptor,
  CorrelationIdInterceptor,
} from 'shared-utils';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    PagesModule,
    ContenedorModule,
    BrowserModule,
    AppRoutingModule,
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
