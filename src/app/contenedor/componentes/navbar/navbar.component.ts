import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { SesionService } from '../../../service/sesion.service';
import { environment } from '../../../../environments/environment';
import { LayoutStateService, NotificationCenterService, NotificationSection, ViewportService } from 'shared-utils';

@Component({
  selector: 'app-navbar',
  standalone: false,

  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('openSidebarButton', { static: false }) openSidebarButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('closeSidebarButton', { static: false }) closeSidebarButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('navbar', { static: false }) navbar?: ElementRef<HTMLElement>;
  @ViewChild('overlay', { static: false }) overlay?: ElementRef<HTMLElement>;

  private readonly subscriptions = new Subscription();

  // Notificaciones
  notificationSections$!: Observable<NotificationSection[]>;
  notificationSections: NotificationSection[] = [];
  notificationsPanelOpen = false;
  selectedFilter: string | null = null;
  filteredSections: NotificationSection[] = [];
  
  mediaQuery$!: Observable<boolean>;

  get totalNotifications(): number {
    return this.notificationCenterService.totalUnread;
  }

  constructor(
    private sesionService: SesionService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(NotificationCenterService) private notificationCenterService: NotificationCenterService,
    @Inject(ViewportService) private viewportService: ViewportService
  ) { }

  ngOnInit() {
    this.mediaQuery$ = this.viewportService.isMobile$;

    this.subscriptions.add(
      this.layoutStateService.notificationsPanelOpen$.subscribe((open: boolean) => {
        this.notificationsPanelOpen = open;
      })
    );

    this.subscriptions.add(
      this.mediaQuery$.subscribe((isMobile: boolean) => {
        this.updateNavbar(isMobile);
      })
    );

    // Inicializar notificaciones
    this.notificationCenterService.ensureInitializedWithMockData();
    this.notificationSections$ = this.notificationCenterService.sections$;

    // Suscribirse a cambios
    this.subscriptions.add(
      this.notificationSections$.subscribe((sections: NotificationSection[]) => {
        this.notificationSections = sections;
        this.applyFilter();
      })
    );
  }

  ngAfterViewInit() {
    this.updateNavbar(this.viewportService.isMobile);
  }

  applyFilter() {
    if (this.selectedFilter === null) {
      this.filteredSections = this.notificationSections;
    } else {
      this.filteredSections = this.notificationSections.filter(
        section => section.id === this.selectedFilter
      );
    }
  }

  selectFilter(filterId: string | null) {
    this.selectedFilter = filterId;
    this.applyFilter();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();

    this.setNotificationsPanelState(false);
  }

  markAsRead(notificationId: string) {
    this.notificationCenterService.markAsRead(notificationId);
  }

  clearSection(sectionId: string) {
    this.notificationCenterService.clearSection(sectionId);
  }

  clearAllNotifications() {
    this.notificationCenterService.clearAll();
  }

  updateNavbar(isMobile: boolean) {
    if (isMobile) {
      this.setNotificationsPanelState(false);
    }

    const navbar = this.navbar?.nativeElement;
    if (!navbar) return;

    if (isMobile) {
      navbar.setAttribute('inert', '');
    } else {
      navbar.removeAttribute('inert');
    }
  }

  toggleNotificationsPanel() {
    this.layoutStateService.toggleNotificationsPanelState();
  }

  closeNotificationsPanel() {
    this.layoutStateService.setNotificationsPanelState(false);
  }

  private setNotificationsPanelState(open: boolean) {
    this.layoutStateService.setNotificationsPanelState(open);
  }

  openSidebar() {
    const navbar = this.navbar?.nativeElement;
    const openButton = this.openSidebarButton?.nativeElement;

    if (!navbar || !openButton) return;

    navbar.classList.add('show');
    openButton.setAttribute('aria-expanded', 'true');
    navbar.removeAttribute('inert');
  }

  closeSidebar() {
    const navbar = this.navbar?.nativeElement;
    const openButton = this.openSidebarButton?.nativeElement;

    if (!navbar || !openButton) return;

    navbar.classList.remove('show');
    openButton.setAttribute('aria-expanded', 'false');
    navbar.setAttribute('inert', '');
  }

  async logout(): Promise<void> {
    try {
      await this.sesionService.logout();
      window.location.href = environment.appLogin;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

}
