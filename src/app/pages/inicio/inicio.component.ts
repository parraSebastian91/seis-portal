import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { SesionService } from '../../service/sesion.service';
import { Router } from '@angular/router';
import { UserImageSet, UserOrgProfileState, UserProfileService, UserStateService, NotificationSocketService } from 'shared-utils';
import { Sistema } from '../../service/interfaces/SystemNavigator.dto';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-inicio',
  standalone: false,

  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnInit, OnDestroy {
  messages: string[] = [
    'Cargando Configuración de inicio',
    'cargando datos de cliente',
    'Iniciando...'
  ];
  currentMessage = this.messages[0];
  visible = true;

  private index = 0;
  private intervalId: any;
  private swapDelay = 300; // ms fade out delay
  private period = 1000; // ms between swaps

  private resolveSocketUrl(): string {
    const bff = environment.BFF ?? '';

    if (/^https?:\/\//i.test(bff)) {
      const host = bff.replace(/\/security\/bff\/?$/i, '').replace(/\/$/, '');
      return `${host}/notifications`;
    }

    return '/notifications';
  }

  constructor(
    private sesionService: SesionService,
    private userProfileService: UserProfileService,
    private userStateService: UserStateService,
    @Inject(NotificationSocketService) private notificationSocketService: NotificationSocketService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.startCycle(this.period);

    try {
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
          '',
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
    } catch (error) {
      console.error('Error during initialization:', error);
      this.setMessage('Error durante la inicialización. Redirigiendo a login externo...', false);
      setTimeout(() => {
        window.location.href = 'http://localhost:8000/pages/login';
      }, 3000);
    }

  }

  ngOnDestroy(): void {
    this.stopCycle();
  }

  startCycle(periodMs: number = 3000): void {
    this.period = periodMs;
    this.stopCycle();
    this.visible = true;
    this.index = 0;
    this.currentMessage = this.messages[this.index];
    this.intervalId = setInterval(() => {
      this.visible = false;
      setTimeout(() => {
        this.index = (this.index + 1) % this.messages.length;
        this.currentMessage = this.messages[this.index];
        this.visible = true;
      }, this.swapDelay);
    }, this.period);
  }

  stopCycle(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Método público para actualizar mensaje inmediato y opcionalmente reiniciar ciclo
  setMessage(msg: string, restartCycle = false): void {
    this.stopCycle();
    this.currentMessage = msg;
    this.visible = true;
    if (restartCycle) this.startCycle(this.period);
  }

  // Añadir mensajes al ciclo
  pushMessage(msg: string): void {
    this.messages.push(msg);
  }

}
