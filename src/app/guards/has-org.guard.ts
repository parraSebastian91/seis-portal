import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { UserStateService } from 'shared-utils';

/**
 * Redirige a /sin-organizacion si el usuario autenticado no tiene una
 * organización activa (recién registrado o removido de todas sus orgs).
 *
 * Excepción: la ruta de creación de organización siempre está permitida,
 * de lo contrario el usuario sin org quedaría atrapado en un bucle
 * sin-organizacion → contenedor/pages/organizaciones/nueva → sin-organizacion.
 */
export const hasOrgGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const userState = inject(UserStateService);
  const router = inject(Router);

  // Always allow the org-creation wizard regardless of org status.
  if (state.url.includes('/organizaciones/nueva')) return true;

  const hasOrganizations = userState
    .organizationProfile()
    .some(org => !!org?.uuid && org.uuid.trim() !== '');

  if (hasOrganizations) return true;
  return router.createUrlTree(['/sin-organizacion']);
};
