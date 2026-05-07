
import { Component, Inject, OnInit, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AppTheme, LayoutStateService, NotificationCenterService, NotificationSection, ThemeService, UserOrgProfileState, UserStateService } from 'shared-utils';

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

  selectedFactoring = 'dashboard';

  readonly organizationProfile!: Signal<UserOrgProfileState[]>;
  readonly orgSelected!: Signal<string>;

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


  constructor(
    private themeService: ThemeService,
    private userStateService: UserStateService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(NotificationCenterService) private notificationCenterService: NotificationCenterService

  ) {
    this.nameApp = environment.nameApp;
    this.organizationProfile = this.userStateService.organizationProfile;
    this.orgSelected = this.userStateService.orgSelected;
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

  onFactoringValueChange(value: string) {
    if (!value) return;
    console.log('[CONTENEDOR] Evento factoringChange capturado:', value);
    this.userStateService.setOrgSelected(value);
    console.log('[CONTENEDOR] orgSelected actualizado en estado:', this.orgSelected());
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

}
