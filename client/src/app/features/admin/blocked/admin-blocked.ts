import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RuleService } from '../../../core/services/rule.service';
import { Stats } from '../../../core/models/rule';
import { Page, Transaction } from '../../../core/models/transaction';
import { apiErrorMessage } from '../../../core/models/api-error';
import { RULE_KEYS, RULE_LABELS } from '../rule-text';

// A bar's length as a % of the biggest value. If everything is 0, every bar is 0 (no divide by zero).
function percentOf(value: number, max: number): number {
  return max > 0 ? (value / max) * 100 : 0;
}

@Component({
  selector: 'app-admin-blocked',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-blocked.html',
  styleUrl: './admin-blocked.scss',
})
export class AdminBlockedPage implements OnInit {
  private ruleService = inject(RuleService);

  readonly labels = RULE_LABELS;
  readonly pageSize = 20;

  stats = signal<Stats | null>(null);
  blocked = signal<Page<Transaction> | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // One bar per rule, in engine order, including rules with 0 blocks.
  ruleBars = computed(() => {
    const stats = this.stats();
    if (!stats) return [];
    const rows = RULE_KEYS.map((key) => ({
      key,
      label: RULE_LABELS[key],
      count: stats.blockedByRule.find((r) => r.rule === key)?.count ?? 0,
    }));
    const max = Math.max(...rows.map((r) => r.count));
    return rows.map((r) => ({ ...r, percent: percentOf(r.count, max) }));
  });

  // One bar per day (oldest first, as the server sends them).
  dayBars = computed(() => {
    const days = this.stats()?.volumePerDay ?? [];
    const max = Math.max(0, ...days.map((d) => d.amount));
    return days.map((d) => ({ ...d, percent: percentOf(d.amount, max) }));
  });

  ngOnInit(): void {
    this.refresh();
  }

  // Reloads the stats and the current page of the log.
  refresh(): void {
    this.error.set(null);
    this.loadStats();
    this.loadPage(this.blocked()?.page ?? 1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.ruleService.getBlocked(page, this.pageSize).subscribe({
      next: (result) => {
        this.blocked.set(result);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private loadStats(): void {
    this.ruleService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err: unknown) => this.error.set(apiErrorMessage(err)),
    });
  }
}
