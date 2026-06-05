import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  EnvironmentInjector,
  HostListener,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DrawerService } from 'shared-utils';

/**
 * Shell genérico del Drawer.
 *
 * Desktop (≥ 700px) → panel lateral desde la derecha.
 * Mobile  (< 700px) → bottom sheet emergente desde abajo.
 *
 * Animaciones: slide-in al abrir, slide-out al cerrar (300ms ease).
 * Tokens: usa --color-bg-surface, --color-text-primary, --color-border del design system.
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (visible()) {
      <!-- Overlay -->
      <div
        class="drawer-overlay"
        [class.drawer-overlay--closing]="closing()"
        (click)="requestClose()"
        aria-hidden="true">
      </div>

      <!-- Panel -->
      <aside
        class="drawer-panel"
        [class.drawer-panel--closing]="closing()"
        [class.drawer-panel--bottom]="isMobile()"
        role="complementary"
        [attr.aria-label]="drawerService.config()!.title"
        [style.--drawer-width]="drawerService.config()!.width ?? '480px'">

        <!-- Handle (solo mobile) -->
        @if (isMobile()) {
          <div class="drawer-handle" aria-hidden="true"></div>
        }

        <!-- Header -->
        <header class="drawer-header">
          <h3 class="drawer-title">{{ drawerService.config()!.title }}</h3>
          <button
            class="drawer-close"
            type="button"
            (click)="requestClose()"
            aria-label="Cerrar panel">
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </header>

        <!-- Contenido dinámico -->
        <div class="drawer-body">
          <ng-container #outlet></ng-container>
        </div>

      </aside>
    }
  `,
  styles: [`
    /* ── Tokens locales (fallback al design system del portal) ── */
    :host {
      --_surface:  var(--color-bg-surface,  var(--background-menu, #1A237E));
      --_text:     var(--color-text-primary, var(--font-color,      #FFFFFF));
      --_border:   var(--color-border,       rgba(255,255,255,.08));
      --_overlay:  rgba(0, 0, 0, .55);
      --_radius:   16px;
      --_duration: 300ms;
      --_ease:     cubic-bezier(.32,.72,0,1);
    }

    /* ── Overlay ── */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: var(--_overlay);
      z-index: 900;
      animation: drawer-fade-in var(--_duration) var(--_ease) both;

      &--closing { animation: drawer-fade-out var(--_duration) var(--_ease) both; }
    }

    /* ── Panel base ── */
    .drawer-panel {
      position: fixed;
      background: var(--_surface);
      color: var(--_text);
      z-index: 901;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      /* ── Desktop: lateral derecho ── */
      top: 0;
      right: 0;
      width: var(--drawer-width, 480px);
      max-width: 100vw;
      height: 100dvh;
      box-shadow: -6px 0 40px rgba(0, 0, 0, .28);
      animation: drawer-slide-right-in var(--_duration) var(--_ease) both;

      &--closing { animation: drawer-slide-right-out var(--_duration) var(--_ease) both; }

      /* ── Mobile: bottom sheet ── */
      &--bottom {
        top: auto;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        max-height: 90dvh;
        height: auto;
        border-radius: var(--_radius) var(--_radius) 0 0;
        box-shadow: 0 -6px 40px rgba(0, 0, 0, .28);
        animation: drawer-slide-up-in var(--_duration) var(--_ease) both;

        &.drawer-panel--closing { animation: drawer-slide-up-out var(--_duration) var(--_ease) both; }
      }
    }

    /* ── Handle mobile ── */
    .drawer-handle {
      width: 40px;
      height: 4px;
      border-radius: 2px;
      background: var(--_border);
      margin: 10px auto 2px;
      flex-shrink: 0;
    }

    /* ── Header ── */
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--_border);
      flex-shrink: 0;
    }

    .drawer-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--_text);
    }

    .drawer-close {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--_text);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      transition: background 0.15s;
      flex-shrink: 0;

      &:hover { background: rgba(255,255,255,.08); }

      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    /* ── Body ── */
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 20px;
      scrollbar-width: thin;
      scrollbar-color: var(--_border) transparent;
    }

    /* ── Keyframes ── */
    @keyframes drawer-fade-in  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes drawer-fade-out { from { opacity: 1 } to { opacity: 0 } }

    @keyframes drawer-slide-right-in  { from { transform: translateX(100%) } to { transform: translateX(0) } }
    @keyframes drawer-slide-right-out { from { transform: translateX(0) }    to { transform: translateX(100%) } }

    @keyframes drawer-slide-up-in  { from { transform: translateY(100%) } to { transform: translateY(0) } }
    @keyframes drawer-slide-up-out { from { transform: translateY(0) }    to { transform: translateY(100%) } }
  `],
})
export class AppDrawerComponent implements OnDestroy {
  readonly drawerService = inject(DrawerService);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly cdr = inject(ChangeDetectorRef);

  /** true mientras el panel está en el DOM (incluye animación de salida) */
  readonly visible = signal(false);
  /** true durante la animación de cierre */
  readonly closing = signal(false);
  readonly isMobile = signal(false);

  private _outlet?: ViewContainerRef;
  private _componentRef?: ComponentRef<unknown>;
  private _closeTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('outlet', { read: ViewContainerRef })
  set outlet(vcr: ViewContainerRef | undefined) {
    this._outlet = vcr;
    if (vcr && this.drawerService.config()) {
      this.mountComponent(vcr);
    }
  }

  constructor() {
    this.updateMobile();

    effect(() => {
      const config = this.drawerService.config();
      if (config) {
        // Cancelar cierre pendiente si se abre inmediatamente
        if (this._closeTimer) clearTimeout(this._closeTimer);
        this.closing.set(false);
        this.visible.set(true);
        if (this._outlet) this.mountComponent(this._outlet);
      } else {
        // null → solo cuando viene de close() interno: ya se maneja en requestClose()
      }
      this.cdr.markForCheck();
    });
  }

  /** Cierra con animación de salida antes de destruir el componente. */
  requestClose(): void {
    if (this.closing()) return;
    this.closing.set(true);
    this.cdr.markForCheck();
    this._closeTimer = setTimeout(() => {
      this.visible.set(false);
      this.closing.set(false);
      this._componentRef?.destroy();
      this._componentRef = undefined;
      this.drawerService.close();
      this.cdr.markForCheck();
    }, 300); // igual que --_duration
  }

  private mountComponent(vcr: ViewContainerRef): void {
    const config = this.drawerService.config();
    if (!config) return;

    this._componentRef?.destroy();
    vcr.clear();

    this._componentRef = vcr.createComponent(config.component, {
      environmentInjector: this.envInjector,
    });

    const instance = this._componentRef.instance as Record<string, unknown>;
    instance['drawerInputs'] = config.inputs;
    this._componentRef.changeDetectorRef.detectChanges();
  }

  @HostListener('window:resize')
  updateMobile(): void {
    this.isMobile.set(window.innerWidth < 700);
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.requestClose();
  }

  ngOnDestroy(): void {
    this._componentRef?.destroy();
    if (this._closeTimer) clearTimeout(this._closeTimer);
  }
}


