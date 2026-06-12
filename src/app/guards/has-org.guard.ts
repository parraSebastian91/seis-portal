import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';
import { UserStateService } from 'shared-utils';
import { SessionRestoreService } from '../service/session-restore.service';

function checkOrg(userState: UserStateService, router: Router, url: string): boolean | ReturnType<typeof router.createUrlTree> {
  if (url.includes('/organizaciones/nueva')) return true;

  const hasOrganizations = userState
    .organizationProfile()
    .some(org => !!org?.uuid && org.uuid.trim() !== '');

  return hasOrganizations ? true : router.createUrlTree(['/sin-organizacion']);
}

/**
 * Redirige a /sin-organizacion si el usuario autenticado no tiene una
 * organización activa (recién registrado o removido de todas sus orgs).
 *
 * Excepción: la ruta de creación de organización siempre está permitida,
 * de lo contrario el usuario sin org quedaría atrapado en un bucle
 * sin-organizacion → contenedor/pages/organizaciones/nueva → sin-organizacion.
 *
 * Seguridad adicional: si tryRestore() todavía está en vuelo (p.ej. por una
 * re-evaluación de guards durante el restore), espera a que termine antes de
 * verificar el estado de la org.
 */
export const hasOrgGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const userState = inject(UserStateService);
  const router = inject(Router);
  const restore = inject(SessionRestoreService);

  // Si el restore todavía está corriendo, esperar a que complete y luego verificar.
  if (restore.restoring()) {
    return restore.tryRestore().pipe(
      map(() => checkOrg(userState, router, state.url)),
    );
  }

  return checkOrg(userState, router, state.url);
};
