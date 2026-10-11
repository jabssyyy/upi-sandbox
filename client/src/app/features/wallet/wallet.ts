import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import { TransferService } from '../../core/services/transfer.service';
import { Transaction } from '../../core/models/transaction';
import { rupeesToPaise } from '../../core/models/money';
import { apiErrorMessage } from '../../core/models/api-error';
import { StatusBadge } from '../../shared/status-badge/status-badge';

const MAX_TOPUP_RUPEES = 50000; // the server's per-call limit

@Component({
  selector: 'app-wallet',
  imports: [RouterLink, FormsModule, NgClass, CurrencyPipe, DatePipe, StatusBadge],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
})
export class WalletPage implements OnInit {
  protected auth = inject(AuthService);
  private walletService = inject(WalletService);
  private transferService = inject(TransferService);

  // The app is zoneless: only signal changes re-render the template.
  protected balance = signal(0); // paise
  protected todaySpent = signal(0); // paise
  protected walletLoading = signal(true);
  protected walletError = signal('');

  protected recent = signal<Transaction[]>([]);
  protected recentLoading = signal(true);
  protected recentError = signal('');

  // "Ravi Kumar" -> "Ravi"
  protected firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  // Top-up form. ngModel on a number input gives a number, or null when empty.
  protected topupRupees = signal<number | null>(null);
  protected topupBusy = signal(false);
  protected topupError = signal('');
  protected topupAdded = signal<number | null>(null); // paise added by the last top-up

  ngOnInit(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => {
        this.balance.set(wallet.balance);
        this.todaySpent.set(wallet.todaySpent);
        this.auth.setBalance(wallet.balance); // keep the nav bar in sync
        this.walletLoading.set(false);
      },
      error: (err) => {
        this.walletError.set(apiErrorMessage(err));
        this.walletLoading.set(false);
      },
    });

    this.transferService.list({ limit: 5 }).subscribe({
      next: (page) => {
        this.recent.set(page.items);
        this.recentLoading.set(false);
      },
      error: (err) => {
        this.recentError.set(apiErrorMessage(err));
        this.recentLoading.set(false);
      },
    });
  }

  topup(): void {
    this.topupError.set('');
    this.topupAdded.set(null);

    const rupees = this.topupRupees();
    // Check in the browser first so we never send a bad amount to the server.
    if (rupees === null || rupees < 1 || rupees > MAX_TOPUP_RUPEES) {
      this.topupError.set('Enter an amount between ₹1 and ₹50,000.');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(rupees))) {
      this.topupError.set('Use at most 2 decimal places.');
      return;
    }

    const paise = rupeesToPaise(rupees);
    this.topupBusy.set(true);
    this.walletService.topup(paise).subscribe({
      next: (res) => {
        this.balance.set(res.balance);
        this.auth.setBalance(res.balance);
        this.topupAdded.set(paise);
        this.topupRupees.set(null);
        this.topupBusy.set(false);
      },
      error: (err) => {
        this.topupError.set(apiErrorMessage(err));
        this.topupBusy.set(false);
      },
    });
  }
}
