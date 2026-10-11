import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RuleService } from '../../../../core/services/rule.service';
import { RuleOutcome, SimulationResult } from '../../../../core/models/rule';
import { rupeesToPaise } from '../../../../core/models/money';
import { apiErrorMessage } from '../../../../core/models/api-error';

const UPI_ID = [Validators.required, Validators.pattern(/^[a-zA-Z0-9.]+@sandbox$/)];

// Badge colour and fallback text for each outcome. Only 'block' comes with a reason from the server.
const OUTCOMES: Record<RuleOutcome, { label: string; badge: string; text: string }> = {
  pass: { label: 'Pass', badge: 'badge-success', text: 'Within the limit' },
  block: { label: 'Block', badge: 'badge-danger', text: '' },
  off: { label: 'Off', badge: 'badge-neutral', text: 'Turned off, not checked' },
};

// Admin "dry run": asks the server what a transfer WOULD do with the current rules.
// Edit a rule, press Run again, and the verdict changes. No money moves.
@Component({
  selector: 'app-rule-simulator',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './rule-simulator.html',
  styleUrl: './rule-simulator.scss',
})
export class RuleSimulator {
  private fb = inject(FormBuilder);
  private ruleService = inject(RuleService);

  protected readonly outcomes = OUTCOMES;

  // Same checks as the send page: a sandbox UPI id, and ₹1 to ₹1,00,000 with at most 2 decimals.
  protected form = this.fb.nonNullable.group({
    fromUpiId: ['', UPI_ID],
    toUpiId: ['', UPI_ID],
    amount: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(100000), Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    ],
  });

  // Zoneless app: everything that changes after the HTTP reply is a signal.
  protected running = signal(false);
  protected result = signal<SimulationResult | null>(null);
  protected error = signal<string | null>(null);

  run(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // reveal every field's error message
      return;
    }
    const { fromUpiId, toUpiId, amount } = this.form.getRawValue();
    this.running.set(true);
    this.error.set(null);

    // The form holds rupees; the API only speaks paise.
    this.ruleService.simulate({ fromUpiId, toUpiId, amount: rupeesToPaise(amount ?? 0) }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.running.set(false);
      },
      error: (err: unknown) => {
        this.result.set(null);
        this.error.set(apiErrorMessage(err));
        this.running.set(false);
      },
    });
  }

  // One message per field, shown only once the user has left the field or pressed Run.
  errorFor(field: 'fromUpiId' | 'toUpiId' | 'amount'): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !control.touched) return null;
    const e = control.errors ?? {};
    if (e['required']) return field === 'amount' ? 'Enter an amount' : 'Enter a UPI id';
    if (e['pattern']) return field === 'amount' ? 'Use at most 2 decimal places' : 'Enter a UPI id like name@sandbox';
    if (e['min']) return 'The minimum is ₹1';
    if (e['max']) return 'The maximum is ₹1,00,000 per transfer';
    return null;
  }
}
