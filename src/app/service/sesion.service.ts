import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable } from 'rxjs';
import { IMenu, ISidebarMenu } from '../interface/menu.interface';
import { IUsuario } from '../interface/usuario.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CallbackInterface } from '../interface/request/callback.interface';
import { ConfigService } from './config.service';
import { Sistema, SystemNavigationDTO } from './interfaces/SystemNavigator.dto';
import { ApiResponse } from '../../../../shared-utils/src/lib/services/types/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class SesionService {

  private menu: BehaviorSubject<ISidebarMenu[]> = new BehaviorSubject<ISidebarMenu[]>([
    { icono: 'home', nombre: 'Inicio', ruta: 'contenedor/pages/inicio' },
    { icono: 'person', nombre: 'Usuarios', ruta: 'contenedor/pages/contacto' },
  ]);
  private usuario: BehaviorSubject<IUsuario> = new BehaviorSubject<IUsuario>({
    nombre: 'Sebastian',
    username: 'sparra',
    correo: 'parra.sebastian91@gmail.com',
    base64Img: 'https://www.w3schools.com/howto/img_avatar.png'
  });
  public readonly menu$: Observable<ISidebarMenu[]> = this.menu.asObservable();
  public readonly usuario$: Observable<IUsuario> = this.usuario.asObservable();

  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  /**
   * Solicita la sesión al BFF y devuelve una Promise con la respuesta.
   * También actualiza los BehaviorSubjects si la respuesta contiene `usuario` o `menu`.
   */
  async createSession(code: string): Promise<any> {
    const base = this.config.getApiBase(); // usa origen configurado
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    const body: CallbackInterface = {
      code,
      codeVerifier: codeVerifier || '',
      typeDevice: this.detectDeviceType()
    };

    const obs$ = this.http.post<any>(`${base + environment.msAuth}/callback`, body, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error fetching session:', error);
          throw error;
        })
      );
    return await firstValueFrom(obs$);
  }

  async getPortalData(): Promise<boolean> {
    const base = this.config.getApiBase(); // usa origen configurado

    const obs$ = this.http.get<ApiResponse<SystemNavigationDTO>>(`${base + environment.BFF}/portal/menu`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error fetching session:', error);
          throw error;
        })
      );
    const serviceRespunse = await firstValueFrom(obs$);
    const dataResponse = serviceRespunse.data;
    console.log('dataResponse', dataResponse);
    if (dataResponse) {
      const sidebarMenus = dataResponse.organizacion[0].sistemas;
      this.menu.next(sidebarMenus.map((sistema: Sistema) => ({
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
      })));

      this.usuario.next({
        nombre: dataResponse.contacto.nombres,
        username: dataResponse.contacto.usuario,
        correo: dataResponse.contacto.correo,
        base64Img: dataResponse.contacto.avatar || 'https://www.w3schools.com/howto/img_avatar.png'
      });
      return true;
    }
    return false;
  }

  logout(): Promise<any> {
    const obs$ = this.http.get<any>(`${environment.msAuth}/logout`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error during logout:', error);
          throw error;
        })
      );
    return firstValueFrom(obs$);
  }

  testSession(): Promise<any> {
    const obs$ = this.http.get<any>(`${environment.msAuth}/auth/session/test`, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error during test session:', error);
          throw error;
        })
      );
    return firstValueFrom(obs$);
  }

  refreshSession(): Promise<any> {
    const obs$ = this.http.post<any>(`${environment.msAuth}/session/refresh`, { typeDevice: this.detectDeviceType() }, { withCredentials: true })
      .pipe(
        catchError(error => {
          console.error('Error during refresh session:', error);
          throw error;
        })
      );
    return firstValueFrom(obs$);
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouch = (navigator as any).maxTouchPoints || 0;

    if (/postmanruntime/i.test(ua)) return 'POSTMAN';
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) || maxTouch > 0) return 'MOBILE';
    if (/electron/i.test(ua) || /Win|Mac|Linux/.test(platform)) return 'DESKTOP';
    return 'WEB';
  }

}

