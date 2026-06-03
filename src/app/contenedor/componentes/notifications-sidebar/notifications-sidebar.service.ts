import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppNotification, NotificationCategory } from './notification.type';

@Injectable({ providedIn: 'root' })
export class NotificationsSidebarService {
  private readonly _items = new BehaviorSubject<AppNotification[]>([]);
  readonly items$ = this._items.asObservable();

  private initialized = false;

  get items(): AppNotification[] {
    return this._items.value;
  }

  get unreadCount(): number {
    return this._items.value.filter(n => !n.read).length;
  }

  get hasReadItems(): boolean {
    return this._items.value.some(n => n.read);
  }

  ensureMockData(): void {
    if (this.initialized) return;
    this.initialized = true;
    const now = Date.now();
    this._items.next([
      {
        id: 'n1', category: 'factura', type: 'invoice.offer_received',
        title: 'Nueva oferta recibida',
        body: 'Ejecutivo Ana hizo una oferta sobre factura #F-001',
        read: false, createdAt: new Date(now - 600_000),
        relatedInvoiceId: 'inv-001', actionUrl: '/contenedor/pages/facturas/inv-001'
      },
      {
        id: 'n2', category: 'factura', type: 'invoice.published',
        title: 'Factura publicada',
        body: 'Tu factura #F-002 ya es visible para ejecutivos',
        read: false, createdAt: new Date(now - 1_800_000),
        relatedInvoiceId: 'inv-002', actionUrl: '/contenedor/pages/facturas/inv-002'
      },
      {
        id: 'n3', category: 'mensaje', type: 'chat.new_message',
        title: 'Nuevo mensaje',
        body: 'Ana en negociación #F-001',
        read: true, createdAt: new Date(now - 86_400_000),
        relatedOfferId: 'offer-001', actionUrl: '/contenedor/pages/chat/offer-001'
      },
      {
        id: 'n4', category: 'alerta', type: 'invoice.expiring_soon',
        title: 'Factura próxima a vencer',
        body: 'Tu factura #F-003 vence en 2 días y no tiene ofertas',
        read: false, createdAt: new Date(now - 172_800_000),
        relatedInvoiceId: 'inv-003', actionUrl: '/contenedor/pages/facturas/inv-003'
      },
    ]);
  }

  prependNotification(notification: AppNotification): void {
    this._items.next([notification, ...this._items.value]);
  }

  markAsRead(id: string): void {
    this._items.next(
      this._items.value.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markBatchAsRead(ids: string[]): void {
    if (!ids.length) return;
    const idSet = new Set(ids);
    this._items.next(
      this._items.value.map(n => idSet.has(n.id) ? { ...n, read: true } : n)
    );
  }

  clearAllRead(): void {
    this._items.next(this._items.value.filter(n => !n.read));
  }

  getByCategory(category: NotificationCategory): AppNotification[] {
    return this._items.value.filter(n => n.category === category);
  }
}
