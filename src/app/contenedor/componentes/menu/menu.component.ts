import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { SesionService } from '../../../service/sesion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutStateService, UserStateService } from 'shared-utils';
import { ISidebarMenu } from 'shared-utils/lib/services/types/SidebarMenu.type';
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

  readonly displayName!: Signal<string>;
  readonly email!: Signal<string>;
  readonly avatarSrc!: Signal<string>;
  readonly sidebarMenus!: Signal<ISidebarMenu[]>;

  @ViewChild('sidebar', { static: true }) sidebar?: ElementRef<HTMLElement>;
  @ViewChild('toggleBtn', { static: true }) toggleButton?: ElementRef<HTMLElement>;

  private sidebarSub?: Subscription;

  constructor(
    private _sesionService: SesionService,
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    private userStateService: UserStateService,
    @Inject(LayoutStateService) private layoutStateService: LayoutStateService
  ) {
    this.displayName = this.userStateService.displayName;
    this.email = this.userStateService.email;
    this.avatarSrc = this.userStateService.avatarSrc;
    this.sidebarMenus = this.userStateService.sidebarMenus;
  }

  ngOnInit(): void {
    this.sidebarSub = this.layoutStateService.sidebarClosed$.subscribe((closed) => {
      this.sidebarClosed = closed;
    });
  }

  ngOnDestroy(): void {
    this.sidebarSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.layoutStateService.toggleSidebarState();
    this.closeAllSubMenus();
  }

  toggleSubMenu(event: Event): void {
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
      this.layoutStateService.setSidebarClosedState(false);
    }
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
    }
  }

  goTo(ruta: string): void {
    this._router.navigate([ruta], { relativeTo: this.activatedRoute });
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
