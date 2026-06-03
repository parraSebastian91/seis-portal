import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { SessionService, User } from 'shared-utils';
import { ConfigService } from './config.service';

interface ProfileApiResponse {
  data: User[];
}

@Injectable({ providedIn: 'root' })
export class SessionRestoreService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly config = inject(ConfigService);

  /** true mientras tryRestore() está en vuelo — usar para spinner global */
  readonly restoring = signal(false);

  /**
   * Intenta restaurar la sesión consultando el perfil del usuario.
   * La cookie auth.session puede seguir activa tras un F5; si es así
   * el backend responde 200 y la sesión queda restaurada.
   * Si la cookie expiró pero auth.refresh es válida, el interceptor
   * authRefreshInterceptor reintenta la petición de forma transparente.
   */
  tryRestore(): Observable<boolean> {
    this.restoring.set(true);
    const url = `${this.config.getApiBase()}/api/core/usuario/profile`;

    return this.http.get<ProfileApiResponse>(url).pipe(
      map(res => {
        const user = res.data?.[0];
        if (user) {
          this.session.setSession(user, null);
          return true;
        }
        return false;
      }),
      catchError(() => of(false)),
      finalize(() => this.restoring.set(false)),
    );
  }
}
