import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CorsInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers = {
      'Content-Type': 'application/json'
      // Añade Authorization u otros headers necesarios aquí, pero NO los Access-Control-Allow-*
    };

    const cloned = req.clone({
      setHeaders: headers,
      // withCredentials: true // habilitar si necesitas cookies / credenciales
    });

    return next.handle(cloned);
  }
}
