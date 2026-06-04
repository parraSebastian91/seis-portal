import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from 'shared-utils';

/**
 * Redirige a /sin-organizacion si el usuario autenticado no tiene una
 * organización activa (recién registrado o removido de todas sus orgs).
 */
export const hasOrgGuard: CanActivateFn = () => {
  const userState = inject(UserStateService);
  const router = inject(Router);

  const hasOrganizations = userState
    .organizationProfile()
    .some(org => !!org?.uuid && org.uuid.trim() !== '');

  if (hasOrganizations) return true;
  return router.createUrlTree(['/sin-organizacion']);
};
