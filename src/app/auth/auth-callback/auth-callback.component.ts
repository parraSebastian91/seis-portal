import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationSocketService, SessionService, User, UserImageSet, UserOrgProfileState, UserProfileService, UserStateService, userOrgProfile } from 'shared-utils';
import { ConfigService } from '../../service/config.service';
import { getRoleRoute } from '../../guards/no-auth.guard';
import { environment } from '../../../environments/environment.development';
import { SesionService } from '../../service/sesion.service';
import { Sistema } from '../../service/interfaces/SystemNavigator.dto';

interface CallbackApiResponse {
  data: unknown[];
}

interface ProfileApiResponse {
  data: User[];
}

const CALLBACK_TIMEOUT_MS = 10_000;

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  // private readonly route = inject(ActivatedRoute);
  // private readonly router = inject(Router);
  // private readonly http = inject(HttpClient);
  // private readonly session = inject(SessionService);
  // private readonly config = inject(ConfigService);

  loading = true;
  errorMsg = '';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private sesionService: SesionService,
    private userProfileService: UserProfileService,
    private userStateService: UserStateService,
    @Inject(NotificationSocketService) private notificationSocketService: NotificationSocketService,
    private session: SessionService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private config: ConfigService
  ) {

  }

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => {
      this.loading = false;
      this.errorMsg = 'La operación tardó demasiado. Intenta iniciar sesión nuevamente.';
    }, CALLBACK_TIMEOUT_MS);

    this.route.queryParams.subscribe(params => {
      const code = params['code'] as string | undefined;
      const cid = params['cid'] as string | undefined;
      this.processCallback(code, cid);
    });
  }

  ngOnDestroy(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private async processCallback(code: string | undefined, cid: string | undefined): Promise<void> {
    if (!code || !cid) {
      this.goToLogin();
      return;
    }
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    const base = this.config.getApiBase();

    // ── Paso 2: intercambio PKCE ──────────────────────────────────────────────
    // ms-auth establece las cookies auth.session + auth.refresh
    try {
      await firstValueFrom(
        this.http.post<CallbackApiResponse>(`${base}/api/auth/security/callback`, {
          code,
          cid,
          codeVerifier,
          typeDevice: this.detectDeviceType(),
        }),
      );
    } catch {
      if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
      this.loading = false;
      this.errorMsg = 'El enlace de acceso ha expirado. Inicia sesión nuevamente.';
      setTimeout(() => this.goToLogin(), 3_000);
      return; // stop — do not continue without a valid session cookie
    }

    // ── Paso 2.5: hidratar SessionService ────────────────────────────────────
    // We must call session.setSession() HERE, before any navigation, so that
    // authGuard sees isAuthenticated() === true immediately when it runs on
    // the target route (e.g. /sin-organizacion). Without this, the guard falls
    // through to tryRestore(), which may race with the fresh PKCE cookie.
    let fetchedUserProfile: Awaited<ReturnType<typeof this.userProfileService.getUserProfile>> | null = null;
    try {
      fetchedUserProfile = await this.userProfileService.getUserProfile();
      if (fetchedUserProfile) {
        const user: import('shared-utils').User = {
          id: fetchedUserProfile.usuarioUUID,
          username: fetchedUserProfile.username,
          correo: fetchedUserProfile.datosContacto?.correo ?? '',
          nombre: fetchedUserProfile.nombre?.nombres ?? fetchedUserProfile.nombreCompleto ?? '',
          apellido: fetchedUserProfile.nombre?.apellidoPaterno ?? '',
          rol: 'USR_STD',
        };
        this.session.setSession(user, null);
        this.userStateService.setBasicInfo(
          fetchedUserProfile.usuarioUUID,
          fetchedUserProfile.username,
          fetchedUserProfile.nombreCompleto,
          fetchedUserProfile.datosContacto?.correo ?? '',
          'USR_STD'
        );
      }
    } catch {
      // Profile unreachable — abort and let the user retry from login.
      if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
      this.loading = false;
      this.errorMsg = 'No se pudo cargar tu perfil. Intenta iniciar sesión nuevamente.';
      setTimeout(() => this.goToLogin(), 3_000);
      return;
    }

    // ── Paso 3: verificar organización ───────────────────────────────────────
    // Check BEFORE loading the rest of the profile data so we can short-circuit
    // to the org-creation wizard without unnecessary API calls.
    let orgProfile: userOrgProfile | null = null;
    try {
      orgProfile = await this.userProfileService.getUserOrganizationProfile();
    } catch {
      // Cannot determine org status — treat as no-org (safe default)
      orgProfile = null;
    }

    const tieneOrganizacion =
      orgProfile !== null && orgProfile.organizaciones.length > 0;

    // TODO: when the backend exposes `tipo_organizacion` on each org entry,
    // read it here: orgProfile.organizaciones[0].tipo  (e.g. 'CEDENTE' | 'FINANCIERA' | 'BROKER')

    if (!tieneOrganizacion) {
      // User has no org yet → send to the org-creation wizard.
      // hasOrgGuard will also enforce this, but we redirect explicitly to avoid
      // an extra navigation cycle.
      if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
      this.router.navigate(['/sin-organizacion']);
      return;
    }

    // ── Paso 4: cargar datos del portal en paralelo ───────────────────────────
    const [portalResult, userImageResult, userOrganizationProfile] = await Promise.allSettled([
      this.sesionService.getPortalData(),
      this.userProfileService.getUserImage(),
      Promise.resolve(orgProfile), // already fetched in Paso 3 — reuse
    ]);

    if (portalResult.status === 'fulfilled' && portalResult.value) {
      const sidebarMenus = portalResult.value.sistemas;
      this.userStateService.patch({
        sidebarMenus: sidebarMenus.map((sistema: Sistema) => ({
          icono: sistema.icono || 'apps',
          nombre: sistema.nombre,
          ruta: sistema.modulos.length === 0 ? `${sistema.ruta.toLowerCase()}` : undefined,
          subMenus: sistema.modulos.length > 0 ? sistema.modulos.map((menu: any) => ({
            icono: menu.icono || 'menu',
            nombre: menu.nombre,
            ruta: `${sistema.ruta.toLowerCase()}/${menu.ruta.toLowerCase()}`
          })) : undefined
        }))
      });
    }

    if (userImageResult.status === 'fulfilled' && userImageResult.value) {
      if (userImageResult.value.avatar?.sm) {
        const userImageSet: UserImageSet = {
          small: userImageResult.value.avatar.sm.path,
          medium: userImageResult.value.avatar.md.path,
          large: userImageResult.value.avatar.lg.path
        };
        this.userStateService.setAvatar(userImageSet);
      }
    }

    // userProfile was already loaded in Paso 2.5 — apply remaining state updates
    if (fetchedUserProfile) {
      this.userStateService.setBasicInfo(
        fetchedUserProfile.usuarioUUID,
        fetchedUserProfile.username,
        fetchedUserProfile.nombreCompleto,
        fetchedUserProfile.datosContacto?.correo ?? '',
        ''
      );
      this.notificationSocketService.connect(
        fetchedUserProfile.username,
        this.resolveSocketUrl()
      );
    }

    if (userOrganizationProfile.status === 'fulfilled' && userOrganizationProfile.value) {
      const organizaciones = (userOrganizationProfile.value as userOrgProfile).organizaciones;
      const userOrgProfileState: UserOrgProfileState[] = organizaciones.map(org => ({
        razonSocial: org.razon_social,
        uuid: org.organizacion_uuid,
      }));
      this.userStateService.setOrganizationProfile(userOrgProfileState);
    }

    // ── Paso 5: navegar al contenedor ─────────────────────────────────────────
    if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
    setTimeout(() => {
      this.router.navigate(['/contenedor/pages']);
    }, 3_000);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/redirect-to-login']);
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouch = (navigator as any).maxTouchPoints || 0;

    if (/postmanruntime/i.test(ua)) return 'POSTMAN';
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) || maxTouch > 0) return 'MOBILE';
    if (/electron/i.test(ua) || /Win|Mac|Linux/.test(platform)) return 'DESKTOP';
    return 'WEB';
  }

  private resolveSocketUrl(): string {
    const bff = environment.BFF ?? '';

    if (/^https?:\/\//i.test(bff)) {
      const host = bff.replace(/\/security\/bff\/?$/i, '').replace(/\/$/, '');
      return `${host}/notifications`;
    }

    return '/notifications';
  }
}
