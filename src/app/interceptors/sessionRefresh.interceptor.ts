import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { SesionService } from '../service/sesion.service';
import { Router } from '@angular/router';

@Injectable()
export class SessionRefreshInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private sesionService: SesionService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Detecta si la sesión expiró (código 401 o mensaje específico)
        if (error.status === 401 || error.error?.message?.includes('Token inválido o expirado')) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Intenta refrescar la sesión
      return new Observable<any>(observer => {
        this.sesionService.refreshSession().then(
          (response) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response);
            observer.next(response);
            observer.complete();
          },
          (error) => {
            this.isRefreshing = false;
            // Si falla el refresh, redirige al login
            //this.router.navigate(['pages','login']);
            observer.error(error);
          }
        );
      }).pipe(
        switchMap(() => next.handle(request))
      );
    } else {
      // Si ya se está refrescando, espera a que termine
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next.handle(request))
      );
    }
  }
}