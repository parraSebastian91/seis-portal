import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserStateService } from 'shared-utils';

@Component({
  selector: 'app-no-organization-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './no-organization-gate.component.html',
  styleUrl: './no-organization-gate.component.scss',
})
export class NoOrganizationGateComponent {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly userState = inject(UserStateService);

  readonly showJoinForm = signal(false);
  readonly accessCode = signal('');
  readonly joinError = signal('');
  readonly joinLoading = signal(false);

  onCreateOrg(): void {
    void this.router.navigateByUrl('/contenedor/pages/organizaciones/nueva');
  }

  onToggleJoin(): void {
    this.showJoinForm.set(!this.showJoinForm());
    this.joinError.set('');
    this.accessCode.set('');
  }

  onAccessCodeInput(value: string): void {
    this.accessCode.set(value.toUpperCase());
    this.joinError.set('');
  }

  onJoinSubmit(): void {
    const code = this.accessCode().trim();
    if (!code) return;

    this.joinLoading.set(true);
    this.joinError.set('');

    this.http.post<{ organizationUuid: string }>('/api/core/org/join', { accessCode: code }).subscribe({
      next: (res) => {
        this.joinLoading.set(false);
        this.userState.setOrgSelected(res.organizationUuid);
        void this.router.navigateByUrl('/contenedor');
      },
      error: () => {
        this.joinLoading.set(false);
        this.joinError.set('Código inválido. Pide al administrador de la organización que te genere un nuevo código.');
      },
    });
  }
}
