import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private hostOverride: string | null;
  constructor() {
    // Prioridad: query param ?apiHost=... > sessionStorage > environment > location.hostname
    const qs = new URLSearchParams(window.location.search);
    this.hostOverride = qs.get('apiHost') || sessionStorage.getItem('apiHost');
  }

  getHost(): string {
    return this.hostOverride || window.location.hostname;
  }

  getProtocol(): string {
    // environment.apiProtocol puede ser 'http' | 'https'
    // const envProto = environment.apiProtocol;
    // if (envProto) return envProto.replace(/:$/, '');
    const p = window.location.protocol || 'http:';
    return p.replace(':', '');
  }

  getPort(): string | null {
    return (window.location.port || null);
  }

  getOrigin(): string {
    const proto = this.getProtocol();
    const host = this.getHost();
    const port = this.getPort();
    return `${proto}://${host}${port ? ':' + port : ''}`;
  }

  getApiBase(path = ''): string {
    const origin = this.getOrigin();
    if (!path) return origin;
    return `${origin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  // Helpers para pruebas desde otro dispositivo
  setHostOverride(host: string | null) {
    if (host) {
      sessionStorage.setItem('apiHost', host);
      this.hostOverride = host;
    } else {
      sessionStorage.removeItem('apiHost');
      this.hostOverride = null;
    }
    // para ver los cambios en runtime
    window.location.reload();
  }
}