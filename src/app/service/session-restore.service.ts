import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { SessionService, User } from 'shared-utils';
import { ConfigService } from './config.service';

interface BffProfileData {
  usuarioUUID: string;
  username: string;
  nombreCompleto: string;
  nombre?: { nombres: string; apellidoPaterno: string; apellidoMaterno?: string };
  datosContacto?: { correo?: string };
}

interface ProfileApiResponse {
  data: BffProfileData;
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
    const url = `${this.config.getApiBase()}/api/bff/usuario/profile`;
    const codesValidos =
      [
        HttpStatusCode.Unauthorized
      ];
    return this.http.get<ProfileApiResponse>(url).pipe(
      map(res => {
        const profile = res.data;
        const ok = !!profile?.usuarioUUID;
        console.log('Intento de restauración de sesión:', ok ? 'Éxito' : 'No hay sesión válida');
        if (ok) {
          const user: User = {
            id: profile.usuarioUUID,
            username: profile.username,
            correo: profile.datosContacto?.correo ?? '',
            nombre: profile.nombre?.nombres ?? profile.nombreCompleto ?? '',
            apellido: profile.nombre?.apellidoPaterno ?? '',
            rol: 'USR_STD',
          };
          this.session.setSession(user, null);
          return true;
        }
        return false;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('Error al intentar restaurar sesión:', error);
        // Solo redirigimos a login cuando el backend confirma sesión inválida.
        // Errores transitorios (timeouts, 5xx, gateway) no deben tumbar la navegación.
        if (codesValidos.includes(error.status)) {
          console.log('Sesión no válida, redirigiendo a login...');
          return of(false);
        }
        console.log('Error de red o servidor, pero no confirmación de sesión inválida. Permitiendo navegación...');
        return of(true);
      }),
      finalize(() => this.restoring.set(false)),
    );
  }
}
