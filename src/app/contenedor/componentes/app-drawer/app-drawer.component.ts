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
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DrawerService } from 'shared-utils';

/**
 * Shell genérico del Drawer.
 * Renderiza dinámicamente cualquier componente que DrawerService.open() indique.
 *
 * Se registra UNA SOLA VEZ en contenedor.component.html.
 * Los MFEs interactúan únicamente a través de DrawerService.
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (drawerService.config()) {
      <!-- Overlay -->
      <div
        class="drawer-overlay"
        (click)="drawerService.close()"
        aria-hidden="true">
      </div>

      <!-- Panel -->
      <aside
        class="drawer-panel"
        role="complementary"
        [attr.aria-label]="drawerService.config()!.title"
        [style.width]="drawerService.config()!.width ?? '480px'">

        <!-- Header -->
        <header class="drawer-header">
          <h3 class="drawer-title">{{ drawerService.config()!.title }}</h3>
          <button
            class="drawer-close"
            type="button"
            (click)="drawerService.close()"
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
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, .4);
      z-index: 900;
    }

    .drawer-panel {
      position: fixed;
      top: 0;
      right: 0;
      height: 100dvh;
      background: var(--surface, #fff);
      box-shadow: -4px 0 24px rgba(0, 0, 0, .15);
      z-index: 901;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider, #e0e0e0);
      flex-shrink: 0;
    }

    .drawer-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .drawer-close {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: inherit;
      padding: 4px;
      border-radius: 4px;

      &:hover { background: rgba(0,0,0,.06); }
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
  `],
})
export class AppDrawerComponent implements OnDestroy {
  readonly drawerService = inject(DrawerService);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('outlet', { read: ViewContainerRef })
  set outlet(vcr: ViewContainerRef | undefined) {
    this._outlet = vcr;
    if (vcr && this.drawerService.config()) {
      this.mountComponent(vcr);
    }
  }

  private _outlet?: ViewContainerRef;
  private _componentRef?: ComponentRef<unknown>;

  constructor() {
    effect(() => {
      const config = this.drawerService.config();
      if (!config) {
        this._componentRef?.destroy();
        this._componentRef = undefined;
        return;
      }
      // El outlet puede no estar disponible aún (primera vez que abre @if)
      // se montará en el setter de @ViewChild cuando el DOM esté listo
      if (this._outlet) {
        this.mountComponent(this._outlet);
      }
      this.cdr.markForCheck();
    });
  }

  private mountComponent(vcr: ViewContainerRef): void {
    const config = this.drawerService.config();
    if (!config) return;

    this._componentRef?.destroy();
    vcr.clear();

    this._componentRef = vcr.createComponent(config.component, {
      environmentInjector: this.envInjector,
    });

    // Pasar inputs
    const instance = this._componentRef.instance as Record<string, unknown>;
    instance['drawerInputs'] = config.inputs;
    this._componentRef.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this._componentRef?.destroy();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerService.config()) {
      this.drawerService.close();
    }
  }
}

