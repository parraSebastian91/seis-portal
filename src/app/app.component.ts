import { Component, inject } from '@angular/core';
import { SessionRestoreService } from './service/session-restore.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly sessionRestore = inject(SessionRestoreService);
}
