import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService, UserRole } from 'shared-utils';

/** Mapa rol → ruta de destino (alias; app-routing los resuelve al MFE real). */
const ROLE_ROUTES: Record<UserRole, string> = {
  CLIENTE_CEDENTE:        '/publicador',
  ADMIN_CEDENTE:          '/publicador',
  EJECUTIVO_FINANCIADORA: '/ofertador',
  ADMIN_FINANCIADORA:     '/ofertador',
  ADMIN_BROKER:           '/ofertador',
  EJECUTIVO_BROKER:       '/ofertador',
  SUPER_ADMIN:            '/dashboard',
  ADMIN:                  '/dashboard',
  USR_STD:                '/dashboard',
  SUPERVISOR:             '/dashboard',
  READ_ONLY:              '/dashboard',
};

/** Devuelve la ruta de destino para el rol dado; /dashboard como fallback. */
export function getRoleRoute(role: UserRole | null): string {
  return (role && ROLE_ROUTES[role]) ?? '/dashboard';
}

/**
 * Impide el acceso a /auth/callback si el usuario ya tiene sesión activa.
 * Redirige directamente a la ruta correspondiente a su rol.
 */
export const noAuthGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    const target = getRoleRoute(session.userRole());
    return router.createUrlTree([target]);
  }

  return true;
};
