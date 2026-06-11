import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, Signal, ViewChild, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SesionService } from '../../../service/sesion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutStateService, UserStateService } from 'shared-utils';
import { ISidebarMenu, IMenu } from 'shared-utils/lib/services/types/SidebarMenu.type';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit, OnDestroy {
  nameApp = environment.nameApp;
  sidebarClosed = false;
  isMobile = false;
  /** Índice del ítem con flyout abierto (solo en modo colapsado desktop). */
  flyoutIndex: number | null = null;
  /** Mensaje de error transitorio para EB-04 (logout fallido). */
  logoutError: string | null = null;
  /** Toggle del dropdown de usuario. */
  userMenuOpen = false;

  readonly displayName!: Signal<string>;
  readonly email!: Signal<string>;
  readonly avatarSrc!: Signal<string>;
  readonly sidebarMenus!: Signal<ISidebarMenu[]>;

  @ViewChild('sidebar', { static: true }) sidebar?: ElementRef<HTMLElement>;
  @ViewChild('toggleBtn', { static: true }) toggleButton?: ElementRef<HTMLElement>;

  private sidebarSub?: Subscription;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private _sesionService: SesionService,
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    private userStateService: UserStateService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.displayName = this.userStateService.displayName;
    this.email = this.userStateService.email;
    this.avatarSrc = this.userStateService.avatarSrc;
    this.sidebarMenus = this.userStateService.sidebarMenus;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 700;
    }
    this.sidebarSub = this.layoutStateService.sidebarClosed$.subscribe((closed) => {
      this.sidebarClosed = closed;
      if (!closed) {
        this.flyoutIndex = null;
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 700;
    if (!this.isMobile) {
      this.flyoutIndex = null;
    }
  }

  ngOnDestroy(): void {
    this.sidebarSub?.unsubscribe();
    if (this.logoutTimer !== null) {
      clearTimeout(this.logoutTimer);
    }
  }

  toggleSidebar(): void {
    if (this.userMenuOpen) {
      this.userMenuOpen = false;
    }
    this.layoutStateService.toggleSidebarState();
    this.closeAllSubMenus();
    this.flyoutIndex = null;
  }

  toggleSubMenu(event: Event, index: number): void {
    event.stopPropagation();

    if (this.sidebarClosed || this.isMobile) {
      // En modo colapsado (desktop) o mobile: flyout en lugar de acordeón
      this.layoutStateService.toggleSidebarState();
       this.flyoutIndex = this.flyoutIndex === index ? null : index;
      return;
    }

    setTimeout(() => {
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
    }, 200);
  }

  closeAllSubMenus(): void {
    const sidebar = this.sidebar?.nativeElement;
    if (!sidebar) return;

    Array.from(sidebar.getElementsByClassName('show')).forEach((ul) => {
      ul.classList.remove('show');
      const previous = ul.previousElementSibling as HTMLElement | null;
      previous?.classList.remove('rotate');
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const sidebar = this.sidebar?.nativeElement;
    const target = event.target as Node | null;
    if (!sidebar || !target) return;

    if (!sidebar.contains(target)) {
      this.closeAllSubMenus();
      this.flyoutIndex = null;
      this.userMenuOpen = false;
    }
  }

  goTo(ruta: string): void {
    this.flyoutIndex = null;
    this.userMenuOpen = false;
    this._router.navigate([ruta], { relativeTo: this.activatedRoute });
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (this.sidebarClosed) {
      this.toggleSidebar();
    }
    setTimeout(() => {
      this.userMenuOpen = !this.userMenuOpen;
    }, 250);
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  /** Devuelve true si el ítem de nivel 1 o alguno de sus subniveles está activo. */
  isActive(item: ISidebarMenu): boolean {
    const url = this._router.url;
    if (item.ruta) {
      return url.includes(item.ruta);
    }
    return item.subMenus?.some((sub: IMenu) => url.includes(sub.ruta)) ?? false;
  }

  /** Devuelve true si la ruta de un subnivel está activa. */
  isSubActive(ruta: string): boolean {
    return this._router.url.includes(ruta);
  }

  async logout(): Promise<void> {
    this.logoutError = null;
    try {
      await this._sesionService.logout();
      globalThis.location.href = environment.appLogin;
    } catch {
      // EB-04: logout fallido — mostrar toast y mantener sesión activa
      this.logoutError = 'No se pudo cerrar la sesión. Intenta nuevamente.';
      this.logoutTimer = setTimeout(() => { this.logoutError = null; }, 4000);
    }
  }
}
