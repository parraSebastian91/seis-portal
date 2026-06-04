import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from 'shared-utils';

/**
 * Redirige a /sin-organizacion si el usuario autenticado no tiene una
 * organización activa (recién registrado o removido de todas sus orgs).
 */
export const hasOrgGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.activeOrg() !== null) return true;
  return router.createUrlTree(['/sin-organizacion']);
};
