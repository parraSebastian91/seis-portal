import { Component, EventEmitter, Input, Output } from '@angular/core';



@Component({
  selector: 'app-top-navbar',
  standalone: false,
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss'
})
export class TopNavbarComponent {
  @Input() notificationsPanelOpen = false;
  @Input() notificationBadgeText = '';
  @Input() badgePulse = false;

  @Output() readonly notificationsClick = new EventEmitter<void>();
  @Output() readonly accountClick = new EventEmitter<void>();

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }

  onAccountClick(): void {
    this.accountClick.emit();
  }
}
