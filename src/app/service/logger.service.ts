import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  private readonly enabled = environment.enableDevLogs;

  log(message: unknown, ...args: unknown[]): void {
    if (this.enabled) console.log('[DEV]', message, ...args);
  }

  warn(message: unknown, ...args: unknown[]): void {
    if (this.enabled) console.warn('[DEV]', message, ...args);
  }

  error(message: unknown, ...args: unknown[]): void {
    // errors always shown regardless of dev mode
    console.error('[ERR]', message, ...args);
  }

  debug(message: unknown, ...args: unknown[]): void {
    if (this.enabled) console.debug('[DEV]', message, ...args);
  }

  info(message: unknown, ...args: unknown[]): void {
    if (this.enabled) console.info('[DEV]', message, ...args);
  }

  group(label: string): void {
    if (this.enabled) console.group(`[DEV] ${label}`);
  }

  groupEnd(): void {
    if (this.enabled) console.groupEnd();
  }

  table(data: unknown): void {
    if (this.enabled) console.table(data);
  }
}
