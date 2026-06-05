
import { Component, HostListener, Inject, OnInit, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AppTheme, LayoutStateService, NotificationCenterService, NotificationSection, ThemeService } from 'shared-utils';
import { Router } from '@angular/router';

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

  get notificationBadgeText(): string {
    if (!this.totalNotifications || this.totalNotifications <= 0) {
      return '';
    }

    return this.totalNotifications > 99 ? '99+' : String(this.totalNotifications);
  }

  theme: AppTheme = {
    primary: '#1976d2',
    secondary: '#1976d2',
    accent: '#ff4081',
    warn: '#f44336',
    background: '#ffffff',
    onPrimary: '#ffffff',
    onFocus: ''
  };
  readonly isMobileView = signal(false);

  constructor(
    private themeService: ThemeService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(NotificationCenterService) private notificationCenterService: NotificationCenterService,
    private router: Router
  ) {
    this.updateViewportMode();
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

    // HU-37 CA-06: inicializa data-theme="dark" (MVP fijo) y carga tema persistido
    this.themeService.initTheme();
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

  toggleNotificationsPanel() {
    this.layoutStateService.toggleNotificationsPanelState();
  }

  onRouterContentInteraction(): void {
    if (this.isMobileView()) {
      return;
    }
    this.layoutStateService.setSidebarClosedState(true);
  }

  onAccountClick(): void {
    this.router.navigate(['/contenedor/pages/view-profile']);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private triggerBadgePulse() {
    this.badgePulse = false;
    requestAnimationFrame(() => {
      this.badgePulse = true;
    });
  }

  private updateViewportMode(): void {
    if (typeof globalThis.innerWidth === 'undefined') {
      this.isMobileView.set(false);
      return;
    }
    this.isMobileView.set(globalThis.innerWidth <= 980);
  }

}
