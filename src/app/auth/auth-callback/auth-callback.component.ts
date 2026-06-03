import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService, User } from 'shared-utils';
import { ConfigService } from '../../service/config.service';
import { getRoleRoute } from '../../guards/no-auth.guard';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly config = inject(ConfigService);

  loading = true;
  errorMsg = '';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => {
      this.loading = false;
      this.errorMsg = 'La operación tardó demasiado. Intenta iniciar sesión nuevamente.';
    }, CALLBACK_TIMEOUT_MS);

    this.route.queryParams.subscribe(params => {
      const code = params['code'] as string | undefined;
      const sid = params['sid'] as string | undefined;
      this.processCallback(code, sid);
    });
  }

  ngOnDestroy(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private async processCallback(code: string | undefined, sid: string | undefined): Promise<void> {
    if (!code || !sid) {
      this.goToLogin();
      return;
    }

    const base = this.config.getApiBase();

    try {
      // Paso 2: intercambio PKCE — ms-auth establece las cookies auth.session + auth.refresh
      await firstValueFrom(
        this.http.post<CallbackApiResponse>(`${base}/api/auth/security/callback`, {
          code,
          sessionId: sid,
          typeDevice: 'WEB',
        }),
      );

      // Paso 3: obtener perfil con la cookie recién seteada
      const profileRes = await firstValueFrom(
        this.http.get<ProfileApiResponse>(`${base}/api/core/usuario/profile`),
      );

      const user = profileRes.data?.[0];
      if (!user) throw new Error('NO_PROFILE');

      // Paso 4: establecer sesión en memoria
      this.session.setSession(user, null);

      // Paso 5: redirect según rol
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      const target = getRoleRoute(user.rol);
      this.router.navigate([target]);
    } catch {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.loading = false;
      this.errorMsg = 'El enlace de acceso ha expirado. Inicia sesión nuevamente.';
      setTimeout(() => this.goToLogin(), 3_000);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/redirect-to-login']);
  }
}
