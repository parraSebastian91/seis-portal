import { Component, ElementRef, Inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { SesionService } from '../../../service/sesion.service';
import { environment } from '../../../../environments/environment';
import { LayoutStateService, NotificationCenterService, NotificationSection } from 'shared-utils';

@Component({
  selector: 'app-navbar',
  standalone: false,

  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('openSidebarButton', { static: false }) openSidebarButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('closeSidebarButton', { static: false }) closeSidebarButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('navbar', { static: false }) navbar?: ElementRef<HTMLElement>;
  @ViewChild('overlay', { static: false }) overlay?: ElementRef<HTMLElement>;

  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  // Notificaciones
  notificationSections$!: Observable<NotificationSection[]>;
  notificationSections: NotificationSection[] = [];
  notificationsPanelOpen = false;
  selectedFilter: string | null = null;
  filteredSections: NotificationSection[] = [];
  
  mediaQuery$ = new Observable<boolean>(observer => {
    const mq = window.matchMedia('(width < 700px)');
    observer.next(mq.matches);
    const listener = (e: MediaQueryListEvent) => observer.next(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  });

  get totalNotifications(): number {
    return this.notificationCenterService.totalUnread;
  }

  constructor(
    private sesionService: SesionService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(NotificationCenterService) private notificationCenterService: NotificationCenterService
  ) { }

  ngOnInit() {
    this.layoutStateService.notificationsPanelOpen$.subscribe((open: boolean) => {
      this.notificationsPanelOpen = open;
    });

    // Initialize media query
    this.mediaQuery = window.matchMedia('(width < 700px)');
    this.mediaQueryListener = (e) => this.updateNavbar(e);

    // Add listener for media changes
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);

    // Initial call
    this.updateNavbar(this.mediaQuery);

    // Inicializar notificaciones
    this.notificationCenterService.ensureInitializedWithMockData();
    this.notificationSections$ = this.notificationCenterService.sections$;

    // Suscribirse a cambios
    this.notificationSections$.subscribe((sections: NotificationSection[]) => {
      this.notificationSections = sections;
      this.applyFilter();
    });
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
    // Clean up listener
    if (this.mediaQuery && this.mediaQueryListener) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryListener);
    }

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

  updateNavbar(media: MediaQueryList | MediaQueryListEvent) {
    const navbar = this.navbar?.nativeElement;
    if (!navbar) return;

    const isMobile = media.matches;
    console.log('Mobile view:', isMobile);

    if (isMobile) {
      navbar.setAttribute('inert', '');
      this.setNotificationsPanelState(false);
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
