import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotificationSocketService, SessionService, User, UserImageSet, UserOrgProfileState, UserProfileService, UserStateService } from 'shared-utils';
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

    try {
      // Paso 2: intercambio PKCE — ms-auth establece las cookies auth.session + auth.refresh
      await firstValueFrom(
        this.http.post<CallbackApiResponse>(`${base}/api/auth/security/callback`, {
          code,
          cid,
          codeVerifier,
          typeDevice: this.detectDeviceType(),
        }),
      );
      } catch {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.loading = false;
      this.errorMsg = 'El enlace de acceso ha expirado. Inicia sesión nuevamente.';
      setTimeout(() => this.goToLogin(), 3_000);
    }


      const [portalResult, userImageResult, userProfile, userOrganizationProfile] = await Promise.allSettled([
        this.sesionService.getPortalData(),
        this.userProfileService.getUserImage(),
        this.userProfileService.getUserProfile(),
        this.userProfileService.getUserOrganizationProfile(),
      ]);

      if (portalResult.status === 'fulfilled' && portalResult.value) {
        const sidebarMenus = portalResult.value.sistemas;
        this.userStateService.patch({
          sidebarMenus: sidebarMenus.map((sistema: Sistema) => ({
            icono: sistema.icono || 'apps',
            nombre: sistema.nombre,
            ruta: sistema.modulos.length === 0 ? `${sistema.ruta.toLowerCase()}` : undefined,
            subMenus: sistema.modulos.length > 0 ? sistema.modulos.map((menu: any) => (
              {
                icono: menu.icono || 'menu',
                nombre: menu.nombre,
                ruta: `${sistema.ruta.toLowerCase()}/${menu.ruta.toLowerCase()}`
              })
            ) : undefined
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

      if (userProfile.status === 'fulfilled' && userProfile.value) {
        console.log('User Profile:', userProfile.value);
        this.userStateService.setBasicInfo(
          userProfile.value.usuarioUUID,
          userProfile.value.username,
          userProfile.value.nombreCompleto,
          userProfile.value.datosContacto.correo,
          ''
        );
        this.notificationSocketService.connect(
          userProfile.value.username,
          this.resolveSocketUrl()
        );
      }

      if (userOrganizationProfile.status === 'fulfilled' && userOrganizationProfile.value) {
        console.log('User Organization Profile:', userOrganizationProfile.value);
        const organizaciones = userOrganizationProfile.value.organizaciones;
        const userOrgProfile: UserOrgProfileState[] = organizaciones.length > 0 ? organizaciones.map(org => ({
          razonSocial: org.razon_social,
          uuid: org.organizacion_uuid
        })) : [{ razonSocial: 'Particular', uuid: 'particular' }];

        this.userStateService.setOrganizationProfile(userOrgProfile);
      }

      setTimeout(() => {
        this.router.navigate(['/contenedor/pages']);
      }, 3000);
      // Paso 3: obtener perfil con la cookie recién seteada
      // const profileRes = await firstValueFrom(
      //   this.http.get<ProfileApiResponse>(`${base}/api/bff/usuario/profile`),
      // );

      // const user = profileRes.data?.[0];
      // if (!user) throw new Error('NO_PROFILE');

      // // Paso 4: establecer sesión en memoria
      // this.session.setSession(user, null);

      // // Paso 5: redirect según rol
      // if (this.timeoutId) {
      //   clearTimeout(this.timeoutId);
      //   this.timeoutId = null;
      // }
      // const target = getRoleRoute(user.rol);
      // this.router.navigate([target]);
    
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
