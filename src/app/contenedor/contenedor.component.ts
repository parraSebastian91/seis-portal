
import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { AppTheme, LayoutStateService, NotificationCenterService, NotificationSection, ThemeService, UserStateService } from 'shared-utils';
import { IMenu, ISidebarMenu } from '../interface/menu.interface';
import { SesionService } from '../service/sesion.service';
import { IUsuario } from '../interface/usuario.interface';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-contenedor',
  standalone: false,
  templateUrl: './contenedor.component.html',
  styleUrl: './contenedor.component.scss'
})
export class ContenedorComponent implements OnInit {
  nameApp = '';
  notificationsPanelOpen = false;
  totalNotifications = 0;
  badgePulse = false;

  factoringOptions = [
    { label: 'Dashboard Facturas', value: 'dashboard' },
    { label: 'Publicador Facturas', value: 'publicador-facturas' }
  ];
  selectedFactoring = 'dashboard';

  menus: ISidebarMenu[] = [] as ISidebarMenu[];
  usuario?: IUsuario = {
    nombre: 'Usuario Demo',
    username: 'usuario.demo',
    correo: 'usuario@ejemplo.com',
    base64Img: ''
  };;

  get avatarSrc() {
    return this.userStateService.avatarSrc;
  }

  get displayName() {
    return this.userStateService.displayName;
  }

  get userEmail() {
    return this.userStateService.email;
  }

  get notificationBadgeText(): string {
    if (!this.totalNotifications || this.totalNotifications <= 0) {
      return '';
    }

    return this.totalNotifications > 99 ? '99+' : String(this.totalNotifications);
  }

  @ViewChild('sidebar', { static: true }) sidebar?: ElementRef<HTMLElement>;
  @ViewChild('toggleBtn', { static: true }) toggleButton?: ElementRef<HTMLElement>;

  theme: AppTheme = {
    primary: '#1976d2',
    secondary: '#1976d2',
    accent: '#ff4081',
    warn: '#f44336',
    background: '#ffffff',
    onPrimary: '#ffffff',
    onFocus: ''
  };


  constructor(
    private themeService: ThemeService,
    private _sesionService: SesionService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userStateService: UserStateService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(NotificationCenterService) private notificationCenterService: NotificationCenterService

  ) {
    this.nameApp = environment.nameApp;
  }

  ngOnInit() {
    this.layoutStateService.notificationsPanelOpen$.subscribe((open: boolean) => {
      this.notificationsPanelOpen = open;
    });

    this.notificationCenterService.ensureInitializedWithMockData();
    this.notificationCenterService.sections$.subscribe((sections: NotificationSection[]) => {
      const nextTotal = sections.reduce(
        (sum: number, section: NotificationSection) =>
          sum + section.notifications.filter((notification) => !notification.read).length,
        0
      );

      if (nextTotal > 0 && nextTotal !== this.totalNotifications) {
        this.triggerBadgePulse();
      }

      this.totalNotifications = nextTotal;
    });

    this._sesionService.menu$.subscribe(menu => this.menus = menu);
    this._sesionService.usuario$.subscribe(usuario => {
      this.usuario = usuario;

      this.userStateService.patch({
        username: usuario?.username || '',
        NombreCompleto: usuario?.nombre || '',
        email: usuario?.correo || ''
      });

      if (usuario?.base64Img) {
        this.userStateService.setAvatar(usuario.base64Img);
      }

      this.userStateService.setStatus('READY');
    });
    const loaded = this.themeService.loadTheme();
    if (loaded) this.theme = loaded;
  }

  apply() {
    this.themeService.setTheme(this.theme);
  }

  reset() {
    this.themeService.reset();
    const loaded = this.themeService.loadTheme();
    if (loaded) this.theme = loaded;
  }

  navigate(ruta: string) {
    this.router.navigate([ruta], { relativeTo: this.activatedRoute });
  }

  /**
   * Navega a una ruta relativa dentro del Portal
   * Ejemplos:
   *   goTo('pages/view-profile') -> /portal/contenedor/pages/view-profile
   *   goTo('pages/edit-profile') -> /portal/contenedor/pages/edit-profile
   */
  goTo(ruta: string) {
    this.router.navigate([ruta], { relativeTo: this.activatedRoute });
  }

  onFactoringChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target?.value) return;

    this.selectedFactoring = target.value;
    this.goTo(`factoring/${target.value}`);
  }

  onFactoringValueChange(value: string) {
    if (!value) return;

    this.selectedFactoring = value;
    this.goTo(`factoring/${value}`);
  }

  toggleNotificationsPanel() {
    this.layoutStateService.toggleNotificationsPanelState();
  }

  private triggerBadgePulse() {
    this.badgePulse = false;
    requestAnimationFrame(() => {
      this.badgePulse = true;
    });
  }

  private setNotificationsPanelState(open: boolean) {
    this.layoutStateService.setNotificationsPanelState(open);
  }

  //========================== SIDEBAR METHODS ========================//

  toggleSidebar() {
    const sidebar = this.sidebar?.nativeElement;
    const toggleButton = this.toggleButton?.nativeElement;
    if (!sidebar || !toggleButton) return;

    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');

    this.closeAllSubMenus();
  }

  toggleSubMenu(event: Event) {
    const button = event.currentTarget as HTMLElement | null;
    const sidebar = this.sidebar?.nativeElement;
    if (!button || !sidebar) return;

    const nextElement = button.nextElementSibling as HTMLElement | null;
    if (!nextElement) return;

    if (!nextElement.classList.contains('show')) {
      this.closeAllSubMenus();
    }

    nextElement.classList.toggle('show');
    button.classList.toggle('rotate');

    if (sidebar.classList.contains('close')) {
      sidebar.classList.toggle('close');
      this.toggleButton?.nativeElement.classList.toggle('rotate');
    }
  }

  closeAllSubMenus() {
    const sidebar = this.sidebar?.nativeElement;


    if (!sidebar) return;

    Array.from(sidebar.getElementsByClassName('show')).forEach((ul) => {
      ul.classList.remove('show');
      const previous = ul.previousElementSibling as HTMLElement | null;
      previous?.classList.remove('rotate');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sidebar = this.sidebar?.nativeElement;
    const target = event.target as Node | null;
    if (!sidebar || !target) return;

    if (!sidebar.contains(target)) {
      this.closeAllSubMenus();
    }
  }

  async logout(): Promise<void> {
    try {
      await this._sesionService.logout();
      window.location.href = environment.appLogin;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
