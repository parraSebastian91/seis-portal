
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { AppTheme } from '../../../../shared-utils/src/lib/theme/theme.interface';
import { ThemeService } from 'shared-utils';
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

  menus: ISidebarMenu[] = [] as ISidebarMenu[];
  usuario?: IUsuario = {
    nombre: 'Usuario Demo',
    username: 'usuario.demo',
    correo: 'usuario@ejemplo.com',
    base64Img: ''
  };;

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
    private activatedRoute: ActivatedRoute
    
  ) {
    this.nameApp = environment.nameApp;
  }

  ngOnInit() {
    this._sesionService.menu$.subscribe(menu => this.menus = menu);
    this._sesionService.usuario$.subscribe(usuario => this.usuario = usuario);
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

  testingSession(ruta: string) {
    this._sesionService.testSession().then((data) => {
      console.log(data);
    }).catch((error) => {
      console.log(error);
    });
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
