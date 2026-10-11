import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { TransferService } from '../../core/services/transfer.service';
import { HistoryFilters, Transaction, TransactionStatus } from '../../core/models/transaction';
import { apiErrorMessage } from '../../core/models/api-error';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { HighlightBlocked } from '../../shared/highlight-blocked.directive';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-history',
  imports: [NgClass, CurrencyPipe, DatePipe, StatusBadge, HighlightBlocked],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class HistoryPage implements OnInit {
  private transferService = inject(TransferService);

  // What the user has typed in the filter bar (not sent until "Apply").
  protected status = signal<'' | TransactionStatus>(''); // '' means All
  protected fromDate = signal(''); // YYYY-MM-DD from <input type="date">
  protected toDate = signal('');
  protected filterError = signal('');

  // The filters the current table was loaded with. Pagination reuses these,
  // so half-typed filters don't sneak in when the user clicks Next.
  private applied: HistoryFilters = {};

  // Results from the server. Signals, because the app is zoneless.
  protected items = signal<Transaction[]>([]);
  protected page = signal(1);
  protected totalPages = signal(1);
  protected total = signal(0);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit(): void {
    this.load(1);
  }

  // The <select> gives back a plain string; narrow it to our type.
  onStatusChange(value: string): void {
    this.status.set(value === 'success' || value === 'blocked' ? value : '');
  }

  apply(): void {
    // YYYY-MM-DD strings sort the same way as the dates they represent.
    if (this.fromDate() && this.toDate() && this.fromDate() > this.toDate()) {
      this.filterError.set('"From" date must be on or before the "To" date.');
      return;
    }
    this.filterError.set('');
    // Empty values become undefined, and TransferService leaves them out of the URL.
    this.applied = {
      status: this.status() || undefined,
      from: this.fromDate() || undefined,
      to: this.toDate() || undefined,
    };
    this.load(1); // new filters always start again from page 1
  }

  reset(): void {
    this.status.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.apply();
  }

  previous(): void {
    if (this.page() > 1) this.load(this.page() - 1);
  }

  next(): void {
    if (this.page() < this.totalPages()) this.load(this.page() + 1);
  }

  // The filtering happens on the server: we only ask for one page of matching rows.
  private load(page: number): void {
    this.loading.set(true);
    this.error.set('');
    this.transferService.list({ ...this.applied, page, limit: PAGE_SIZE }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.page.set(res.page);
        this.totalPages.set(Math.max(res.totalPages, 1)); // 0 results still reads "Page 1 of 1"
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
