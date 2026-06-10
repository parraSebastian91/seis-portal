import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchableCardItem, SearchableCardSelectComponent, UserStateService } from 'shared-utils';

@Component({
  selector: 'app-organization-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SearchableCardSelectComponent],
  templateUrl: './organization-selector.component.html',
  styleUrl: './organization-selector.component.scss',
})
export class OrganizationSelectorComponent implements OnInit {
  private readonly userStateService = inject(UserStateService);
  private readonly router = inject(Router);

  get items(): SearchableCardItem[] {
    return this.userStateService.organizationProfile()
      .filter(org => !!org.uuid)
      .map(org => ({
        id: org.uuid,
        name: org.razonSocial,
        meta: org.rut ?? undefined,
      }));
  }

  get hasOrgs(): boolean {
    return this.items.length > 0;
  }

  get selectedId(): string | null {
    return this.userStateService.orgSelected() || null;
  }

  ngOnInit(): void {
    // Inicializa la org seleccionada con la primera disponible si ninguna está activa (CA-07)
    if (!this.userStateService.orgSelected()) {
      const first = this.userStateService.organizationProfile()[0];
      if (first) {
        this.userStateService.setOrgSelected(first.uuid);
      }
    }
  }

  onSelectionChange(item: SearchableCardItem): void {
    this.userStateService.setOrgSelected(item.id);
  }

  onProfileClick(item: SearchableCardItem): void {
    this.router.navigate(['/contenedor/pages/organizaciones', item.id]);
  }

  onCreateOrg(): void {
    this.router.navigateByUrl('/contenedor/pages/organizaciones/nueva');
  }
}
