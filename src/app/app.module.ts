
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CorsInterceptor } from './interceptors/cors.interceptor';
import { PagesModule } from './pages/pages.module';
import { ContenedorModule } from './contenedor/contenedor.module';
import { SessionRefreshInterceptor } from './interceptors/sessionRefresh.interceptor';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    PagesModule,
    ContenedorModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    provideAnimationsAsync(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SessionRefreshInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
