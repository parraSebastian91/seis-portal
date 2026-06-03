import {
  AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  HostListener, inject, OnDestroy, OnInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LayoutStateService } from 'shared-utils';
import { AppNotification, NotificationCategory } from './notification.type';
import { NotificationsSidebarService } from './notifications-sidebar.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

export type FilterCategory = 'todas' | NotificationCategory;

function timeGroup(date: Date): 'hoy' | 'ayer' | 'semana' | 'anteriores' {
  const now = new Date();
  const d = new Date(date);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000);
  if (d >= startOfToday) return 'hoy';
  if (d >= startOfYesterday) return 'ayer';
  if (d >= startOfWeek) return 'semana';
  return 'anteriores';
}

const GROUP_LABELS: Record<string, string> = {
  hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', anteriores: 'Anteriores'
};

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  factura: 'receipt_long',
  mensaje: 'mail',
  alerta: 'warning',
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  factura: 'Facturas',
  mensaje: 'Mensajes',
  alerta: 'Alertas',
};

export interface NotificationGroup {
  groupKey: string;
  groupLabel: string;
  categories: CategoryBlock[];
}

export interface CategoryBlock {
  category: NotificationCategory;
  icon: string;
  label: string;
  unreadCount: number;
  items: AppNotification[];
}

@Component({
  selector: 'app-notifications-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './notifications-sidebar.component.html',
  styleUrl: './notifications-sidebar.component.scss',
})
export class NotificationsSidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly service = inject(NotificationsSidebarService);
  private readonly layoutStateService = inject(LayoutStateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isOpen = false;
  activeFilter: FilterCategory = 'todas';
  groups: NotificationGroup[] = [];
  allItems: AppNotification[] = [];
  showClearConfirm = false;

  private readonly intersectionObservers = new Map<string, IntersectionObserver>();
  private readonly readTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private subscription?: Subscription;
  private layoutSubscription?: Subscription;

  readonly categoryFilters: { key: FilterCategory; icon: string; label: string }[] = [
    { key: 'todas', icon: 'apps', label: 'Todas' },
    { key: 'factura', icon: CATEGORY_ICONS.factura, label: CATEGORY_LABELS.factura },
    { key: 'mensaje', icon: CATEGORY_ICONS.mensaje, label: CATEGORY_LABELS.mensaje },
    { key: 'alerta', icon: CATEGORY_ICONS.alerta, label: CATEGORY_LABELS.alerta },
  ];

  ngOnInit(): void {
    this.service.ensureMockData();
    this.subscription = this.service.items$.subscribe(items => {
      this.allItems = items;
      this.buildGroups();
      this.cdr.markForCheck();
    });
    this.layoutSubscription = this.layoutStateService.notificationsPanelOpen$.subscribe(open => {
      this.isOpen = open;
      if (!open) this.clearAllObservers();
      this.cdr.markForCheck();
    });
  }

  ngAfterViewChecked(): void {
    if (!this.isOpen) return;
    // Observe all unread cards that are not yet observed
    const cards = globalThis.document?.querySelectorAll<HTMLElement>('[data-nid]');
    if (!cards) return;
    for (const card of Array.from(cards)) {
      const nid = card.dataset['nid'];
      if (nid && !this.intersectionObservers.has(nid)) {
        this.observeCard(card, nid);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.layoutSubscription?.unsubscribe();
    this.clearAllObservers();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.close();
  }

  close(): void {
    this.layoutStateService.setNotificationsPanelState(false);
    this.showClearConfirm = false;
  }

  setFilter(filter: FilterCategory): void {
    this.activeFilter = filter;
    this.buildGroups();
    this.cdr.markForCheck();
  }

  get hasItems(): boolean {
    return this.allItems.length > 0;
  }

  get hasReadItems(): boolean {
    return this.service.hasReadItems;
  }

  get isEmpty(): boolean {
    const filtered = this.filteredItems;
    return filtered.length === 0;
  }

  get filteredItems(): AppNotification[] {
    if (this.activeFilter === 'todas') return this.allItems;
    return this.allItems.filter(n => n.category === this.activeFilter);
  }

  buildGroups(): void {
    const items = this.filteredItems;
    const groupMap = new Map<string, Map<NotificationCategory, AppNotification[]>>();
    const ORDER: string[] = ['hoy', 'ayer', 'semana', 'anteriores'];

    for (const item of items) {
      const gk = timeGroup(item.createdAt);
      if (!groupMap.has(gk)) groupMap.set(gk, new Map());
      const catMap = groupMap.get(gk)!;
      if (!catMap.has(item.category)) catMap.set(item.category, []);
      catMap.get(item.category)!.push(item);
    }

    const categories: NotificationCategory[] = ['factura', 'mensaje', 'alerta'];
    this.groups = ORDER.filter(k => groupMap.has(k)).map(gk => ({
      groupKey: gk,
      groupLabel: GROUP_LABELS[gk],
      categories: categories
        .filter(cat => groupMap.get(gk)!.has(cat))
        .map(cat => {
          const catItems = groupMap.get(gk)!.get(cat)!;
          return {
            category: cat,
            icon: CATEGORY_ICONS[cat],
            label: CATEGORY_LABELS[cat],
            unreadCount: catItems.filter(n => !n.read).length,
            items: catItems,
          };
        }),
    }));
  }

  showCategoryHeader(): boolean {
    return this.activeFilter === 'todas';
  }

  onCardClick(notification: AppNotification): void {
    this.service.markAsRead(notification.id);
    this.close();
    this.router.navigateByUrl(notification.actionUrl);
  }

  onMarkRead(notification: AppNotification): void {
    this.service.markAsRead(notification.id);
  }

  onClearAllClick(): void {
    this.showClearConfirm = true;
  }

  onClearConfirm(): void {
    this.service.clearAllRead();
    this.showClearConfirm = false;
  }

  onClearCancel(): void {
    this.showClearConfirm = false;
  }

  observeCard(el: HTMLElement, notificationId: string): void {
    if (this.intersectionObservers.has(notificationId)) return;
    // Only observe unread items
    const item = this.allItems.find(n => n.id === notificationId);
    if (!item || item.read) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const timer = setTimeout(() => {
              this.service.markAsRead(notificationId);
              observer.disconnect();
              this.intersectionObservers.delete(notificationId);
              this.readTimers.delete(notificationId);
            }, 2000);
            this.readTimers.set(notificationId, timer);
          } else {
            const timer = this.readTimers.get(notificationId);
            if (timer) {
              clearTimeout(timer);
              this.readTimers.delete(notificationId);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    this.intersectionObservers.set(notificationId, observer);
  }

  private clearAllObservers(): void {
    for (const [, obs] of this.intersectionObservers) obs.disconnect();
    this.intersectionObservers.clear();
    for (const [, t] of this.readTimers) clearTimeout(t);
    this.readTimers.clear();
  }

  trackById(_: number, item: AppNotification): string {
    return item.id;
  }

  trackByGroup(_: number, group: NotificationGroup): string {
    return group.groupKey;
  }

  trackByCat(_: number, cat: CategoryBlock): string {
    return cat.category;
  }
}
