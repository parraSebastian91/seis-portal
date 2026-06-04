import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LOGIN_APP_URL } from 'shared-utils';

/**
 * Componente interno del Shell que hace una hard-navigation hacia app-login.
 * No renderiza contenido visible — sólo un spinner mientras el browser redirige.
 * Propaga ?returnUrl= para que app-login lo reenvíe tras un login exitoso.
 */
@Component({
  selector: 'app-redirect-to-login',
  standalone: false,
  template: `
    <div class="redir-wrap">
      <mat-spinner diameter="40" aria-label="Redirigiendo al inicio de sesión..."></mat-spinner>
    </div>
  `,
  styles: [`
    .redir-wrap {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: var(--bg, #fafafa);
    }
  `],
})
export class RedirectToLoginComponent implements OnInit {
  private readonly loginUrl = inject(LOGIN_APP_URL);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
    const target = returnUrl
      ? `${this.loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
      : this.loginUrl;
    // globalThis.location.href = target;
  }
}
