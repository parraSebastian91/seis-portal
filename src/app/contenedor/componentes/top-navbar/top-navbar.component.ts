import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FactoringOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-top-navbar',
  standalone: false,
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss'
})
export class TopNavbarComponent {
  @Input() factoringOptions: FactoringOption[] = [];
  @Input() selectedFactoring = '';
  @Input() notificationsPanelOpen = false;
  @Input() notificationBadgeText = '';
  @Input() badgePulse = false;

  @Output() factoringChange = new EventEmitter<string>();
  @Output() notificationsClick = new EventEmitter<void>();

  onFactoringChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target?.value) return;

    this.factoringChange.emit(target.value);
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }
}
