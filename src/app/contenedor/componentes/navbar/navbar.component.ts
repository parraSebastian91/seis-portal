import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SesionService } from '../../../service/sesion.service';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: string;
  title: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSection {
  id: string;
  name: string;
  icon: string;
  notifications: Notification[];
}

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
  private notificationsSubject = new BehaviorSubject<NotificationSection[]>([]);
  notificationSections$ = this.notificationsSubject.asObservable();
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
    return this.notificationSections.reduce((sum, section) => 
      sum + section.notifications.filter(n => !n.read).length, 0
    );
  }

  constructor( private sesionService: SesionService ) { }

  ngOnInit() {
    // Initialize media query
    this.mediaQuery = window.matchMedia('(width < 700px)');
    this.mediaQueryListener = (e) => this.updateNavbar(e);

    // Add listener for media changes
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);

    // Initial call
    this.updateNavbar(this.mediaQuery);

    // Inicializar notificaciones
    this.initializeNotifications();

    // Suscribirse a cambios
    this.notificationSections$.subscribe(sections => {
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

  private initializeNotifications() {
    // Datos de ejemplo - reemplazar con datos reales del servicio
    const mockSections: NotificationSection[] = [
      {
        id: 'orders',
        name: 'Pedidos',
        icon: 'shopping_cart',
        notifications: [
          { id: '1', title: 'Nuevo pedido #12345', timestamp: new Date(Date.now() - 3600000), read: false },
          { id: '2', title: 'Pedido #12344 actualizado', timestamp: new Date(Date.now() - 7200000), read: false }
        ]
      },
      {
        id: 'invoices',
        name: 'Facturas',
        icon: 'receipt',
        notifications: [
          { id: '3', title: 'Factura #F-001 emitida', timestamp: new Date(Date.now() - 1800000), read: true }
        ]
      },
      {
        id: 'messages',
        name: 'Mensajes',
        icon: 'mail',
        notifications: [
          { id: '4', title: 'Nuevo mensaje de Admin', timestamp: new Date(Date.now() - 600000), read: false },
          { id: '5', title: 'Mensaje del Sistema', timestamp: new Date(Date.now() - 900000), read: false },
          { id: '6', title: 'Respuesta a tu consulta', timestamp: new Date(Date.now() - 1200000), read: true }
        ]
      },
      {
        id: 'alerts',
        name: 'Alertas',
        icon: 'warning',
        notifications: []
      }
    ];

    this.notificationsSubject.next(mockSections);
  }

  markAsRead(notificationId: string) {
    const sections = this.notificationSections.map(section => ({
      ...section,
      notifications: section.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    }));
    this.notificationsSubject.next(sections);
  }

  clearSection(sectionId: string) {
    const sections = this.notificationSections.map(section =>
      section.id === sectionId ? { ...section, notifications: [] } : section
    );
    this.notificationsSubject.next(sections);
  }

  clearAllNotifications() {
    const sections = this.notificationSections.map(section => ({
      ...section,
      notifications: []
    }));
    this.notificationsSubject.next(sections);
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
    this.setNotificationsPanelState(!this.notificationsPanelOpen);
  }

  closeNotificationsPanel() {
    this.setNotificationsPanelState(false);
  }

  private setNotificationsPanelState(open: boolean) {
    this.notificationsPanelOpen = open;
    const container = document.querySelector('.body');
    if (container) {
      container.classList.toggle('notifications-open', open);
    }
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
