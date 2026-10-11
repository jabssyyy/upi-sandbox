import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginPage } from './features/auth/login/login';
import { RegisterPage } from './features/auth/register/register';
import { WalletPage } from './features/wallet/wallet';
import { SendPage } from './features/send/send';
import { HistoryPage } from './features/history/history';
import { AdminRulesPage } from './features/admin/rules/admin-rules';
import { AdminBlockedPage } from './features/admin/blocked/admin-blocked';
import { NotFoundPage } from './features/not-found/not-found';

// The router swaps the component inside <router-outlet> based on the URL. No page reloads.
export const routes: Routes = [
  { path: 'login', component: LoginPage, title: 'Log in · UPI Sandbox' },
  { path: 'register', component: RegisterPage, title: 'Register · UPI Sandbox' },
  { path: 'wallet', component: WalletPage, canActivate: [authGuard], title: 'Wallet · UPI Sandbox' },
  { path: 'send', component: SendPage, canActivate: [authGuard], title: 'Send money · UPI Sandbox' },
  { path: 'history', component: HistoryPage, canActivate: [authGuard], title: 'History · UPI Sandbox' },
  { path: 'admin/rules', component: AdminRulesPage, canActivate: [adminGuard], title: 'Fraud rules · UPI Sandbox' },
  { path: 'admin/blocked', component: AdminBlockedPage, canActivate: [adminGuard], title: 'Blocked log · UPI Sandbox' },
  { path: '', redirectTo: 'wallet', pathMatch: 'full' },
  { path: '**', component: NotFoundPage, title: 'Not found · UPI Sandbox' }, // must be last
];
