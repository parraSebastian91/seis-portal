import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap } from 'rxjs/operators';
import { SessionService, User, UserStateService, UserProfileService, UserImageSet, UserOrgProfileState } from 'shared-utils';
import { ConfigService } from './config.service';
import { SesionService } from './sesion.service';
import { Sistema } from './interfaces/SystemNavigator.dto';
import { environment } from '../../environments/environment';

interface BffProfileData {
  usuarioUUID: string;
  username: string;
  nombreCompleto: string;
  nombre?: { nombres: string; apellidoPaterno: string; apellidoMaterno?: string };
  datosContacto?: { correo?: string };
  roles?: string[];
}

interface ProfileApiResponse {
  data: BffProfileData;
}

@Injectable({ providedIn: 'root' })
export class SessionRestoreService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly config = inject(ConfigService);
  private readonly userState = inject(UserStateService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly sesionService = inject(SesionService);

  /** true mientras tryRestore() está en vuelo — usar para spinner global */
  readonly restoring = signal(false);

  /**
   * Observable compartido mientras hay un restore en curso.
   * Evita doble-request si dos guards disparan tryRestore() en paralelo.
   */
  private restore$: Observable<boolean> | null = null;

  /**
   * Intenta restaurar la sesión consultando el perfil del usuario.
   * La cookie auth.session puede seguir activa tras un F5; si es así
   * el backend responde 200 y la sesión queda restaurada.
   * También hidrata UserStateService (displayName, email, avatar, sidebarMenus,
   * organizationProfile) para que el menu y hasOrgGuard funcionen correctamente.
   *
   * Llamadas concurrentes comparten el mismo Observable (shareReplay) y no
   * generan requests duplicados.
   */
  tryRestore(): Observable<boolean> {
    if (this.restore$) return this.restore$;

    this.restoring.set(true);
    const url = `${environment.getBaseUrl()}/api/bff/usuario/profile`;

    this.restore$ = this.http.get<ProfileApiResponse>(url).pipe(
      switchMap(res => from(this._hydrateFromProfile(res.data))),
      catchError((error: HttpErrorResponse) => {
        console.log('Error al intentar restaurar sesión:', error);
        // Solo redirigimos a login cuando el backend confirma sesión inválida.
        // Errores transitorios (timeouts, 5xx, gateway) no deben tumbar la navegación.
        if (error.status === HttpStatusCode.Unauthorized) {
          console.log('Sesión no válida, redirigiendo a login...');
          return of(false);
        }
        console.log('Error de red o servidor, pero no confirmación de sesión inválida. Permitiendo navegación...');
        return of(true);
      }),
      finalize(() => {
        this.restoring.set(false);
        this.restore$ = null;
      }),
      shareReplay(1),
    );

    return this.restore$;
  }

  private async _hydrateFromProfile(profile: BffProfileData): Promise<boolean> {
    if (!profile?.usuarioUUID) {
      console.log('Restauración de sesión: sin perfil válido.');
      return false;
    }

    console.log('Restaurando sesión y datos de usuario...');

    // 1. Construir el objeto de usuario (sin autenticar todavía)
    const user: User = {
      id: profile.usuarioUUID,
      username: profile.username,
      correo: profile.datosContacto?.correo ?? '',
      nombre: profile.nombre?.nombres ?? profile.nombreCompleto ?? '',
      apellido: profile.nombre?.apellidoPaterno ?? '',
      rol: profile.roles && profile.roles.length > 0
        ? profile.roles[0] as User['rol']
        : 'USR_STD',
    };

    // 2. Hidratar UserStateService con info básica (sin marcar sesión como autenticada todavía)
    this.userState.setBasicInfo(
      profile.usuarioUUID,
      profile.username,
      profile.nombreCompleto,
      profile.datosContacto?.correo ?? '',
      profile.roles ?? []
    );

    // 3. Cargar org, menus y avatar en paralelo ANTES de marcar la sesión como autenticada.
    // Esto es crítico: setSession() (isAuthenticated = true) debe ejecutarse DESPUÉS de que
    // setOrganizationProfile() haya sido llamado. Si se hiciera antes, cualquier re-evaluación
    // de guards durante el await (p.ej. por re-montaje del router-outlet) encontraría
    // isAuthenticated=true pero organizationProfile vacío → false-redirect a /sin-organizacion.
    const [orgResult, portalResult, imageResult] = await Promise.allSettled([
      this.userProfileService.getUserOrganizationProfile(),
      this.sesionService.getPortalData(),
      this.userProfileService.getUserImage(),
    ]);

    if (orgResult.status === 'fulfilled' && orgResult.value) {
      const orgs = orgResult.value.organizaciones;
      const orgProfiles: UserOrgProfileState[] = orgs.length > 0
        ? orgs.map(org => ({ razonSocial: org.razon_social, uuid: org.organizacion_uuid }))
        : [{ razonSocial: 'Particular', uuid: 'particular' }];
      this.userState.setOrganizationProfile(orgProfiles);
    } else {
      // La carga de org falló (error de red o servidor), no significa que el usuario
      // no tenga org. Usamos el fallback 'particular' para que hasOrgGuard no
      // redirija falsamente a /sin-organizacion.
      this.userState.setOrganizationProfile([{ razonSocial: 'Particular', uuid: 'particular' }]);
    }

    if (portalResult.status === 'fulfilled' && portalResult.value) {
      const sistemas = portalResult.value.sistemas;
      this.userState.patch({
        sidebarMenus: sistemas.map((sistema: Sistema) => ({
          icono: sistema.icono || 'apps',
          nombre: sistema.nombre,
          ruta: sistema.modulos.length === 0 ? sistema.ruta.toLowerCase() : undefined,
          subMenus: sistema.modulos.length > 0
            ? sistema.modulos.map((menu: any) => ({
                icono: menu.icono || 'menu',
                nombre: menu.nombre,
                ruta: `${sistema.ruta.toLowerCase()}/${menu.ruta.toLowerCase()}`
              }))
            : undefined
        }))
      });
    }

    if (imageResult.status === 'fulfilled' && imageResult.value?.avatar?.sm) {
      const img = imageResult.value.avatar;
      const imageSet: UserImageSet = {
        small: img.sm.path,
        medium: img.md.path,
        large: img.lg.path
      };
      this.userState.setAvatar(imageSet);
    }

    // 4. Marcar la sesión como autenticada DESPUÉS de que todos los datos estén listos.
    // Garantiza que hasOrgGuard nunca vea isAuthenticated=true con org vacío.
    this.session.setSession(user, null);

    console.log('Sesión y datos de usuario restaurados correctamente.');
    return true;
  }
}
