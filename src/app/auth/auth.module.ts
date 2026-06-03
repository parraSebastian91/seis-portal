import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthCallbackComponent } from './auth-callback/auth-callback.component';
import { RedirectToLoginComponent } from './redirect-to-login/redirect-to-login.component';
import { noAuthGuard } from '../guards/no-auth.guard';

const routes: Routes = [
  {
    path: 'callback',
    component: AuthCallbackComponent,
    canActivate: [noAuthGuard],
  },
  {
    path: 'redirect-to-login',
    component: RedirectToLoginComponent,
  },
];

@NgModule({
  declarations: [
    AuthCallbackComponent,
    RedirectToLoginComponent,
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    RouterModule.forChild(routes),
  ],
})
export class AuthModule {}
