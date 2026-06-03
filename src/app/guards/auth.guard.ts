import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';
import { SessionService } from 'shared-utils';
import { SessionRestoreService } from '../service/session-restore.service';

/**
 * Protege todas las rutas autenticadas del Shell.
 * Si SessionService ya tiene sesión → permite el acceso inmediatamente.
 * Si no (recarga de página) → intenta restaurar sesión vía profile endpoint
 * antes de redirigir al login.
 */
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const restore = inject(SessionRestoreService);

  if (session.isAuthenticated()) return true;

  return restore.tryRestore().pipe(
    map(ok =>
      ok
        ? true
        : router.createUrlTree(['/auth/redirect-to-login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};
