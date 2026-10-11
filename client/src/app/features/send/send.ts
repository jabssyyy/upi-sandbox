import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { TransferService } from '../../core/services/transfer.service';
import { rupeesToPaise } from '../../core/models/money';
import { apiErrorBody, apiErrorMessage } from '../../core/models/api-error';
import { RuleKey } from '../../core/models/rule';

// <input type="number"> happily accepts 10.555, but paise can't be split further.
function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === null || value === '') return null; // "required" reports empty fields
  return /^\d+(\.\d{1,2})?$/.test(String(value)) ? null : { decimals: true };
}

// The outcome of the last Send press. One signal, so only one panel can ever show.
type SendResult =
  | { kind: 'success'; amount: number; to: string; balance: number }
  | { kind: 'blocked'; message: string; rule: string }
  | { kind: 'error'; message: string };

const RULE_LABELS: Record<RuleKey, string> = {
  DAILY_LIMIT: 'Daily limit',
  NEW_PAYEE_CAP: 'New payee cap',
  VELOCITY: 'Too many transfers',
};

@Component({
  selector: 'app-send',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './send.html',
  styleUrl: './send.scss',
})
export class SendPage {
  private fb = inject(FormBuilder);
  private transfers = inject(TransferService);
  protected auth = inject(AuthService);

  // nonNullable: reset() goes back to these starting values instead of null.
  protected form = this.fb.nonNullable.group({
    toUpiId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.]+@sandbox$/)]],
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100000), maxTwoDecimals]],
    note: ['', Validators.maxLength(60)],
  });

  // The app is zoneless: anything that changes after an HTTP reply must be a signal.
  protected submitting = signal(false);
  protected receiver = signal<{ name: string; upiId: string } | null>(null);
  protected receiverNotFound = signal(false);
  protected result = signal<SendResult | null>(null);

  constructor() {
    // A name shown for an old UPI id would be misleading, so drop it as soon as the id changes.
    this.form.controls.toUpiId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.receiver.set(null);
      this.receiverNotFound.set(false);
    });
  }

  // Called on blur of the UPI field. Only a hint for the user: the server still checks on send.
  lookupReceiver(): void {
    const upiField = this.form.controls.toUpiId;
    const upiId = upiField.value;
    if (upiField.invalid || this.receiver()?.upiId === upiId) return;

    this.transfers.lookup(upiId).subscribe({
      next: (user) => {
        // Ignore a slow reply if the user has typed a different id meanwhile.
        if (upiField.value === upiId) this.receiver.set(user);
      },
      error: (err: unknown) => {
        if (upiField.value === upiId && apiErrorBody(err)?.code === 'NOT_FOUND') this.receiverNotFound.set(true);
      },
    });
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // reveal every field's error message
      return;
    }
    const { toUpiId, amount, note } = this.form.getRawValue();
    this.result.set(null);
    this.submitting.set(true);

    // The form holds rupees; the API only speaks paise. Convert here and nowhere else.
    this.transfers.send({ toUpiId, amount: rupeesToPaise(amount ?? 0), note: note.trim() || undefined }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.auth.setBalance(res.balance);
        this.result.set({
          kind: 'success',
          amount: res.transaction.amount,
          to: this.receiver()?.name ?? toUpiId,
          balance: res.balance,
        });
        // Keep the receiver so sending again is quick.
        this.form.controls.amount.reset();
        this.form.controls.note.reset();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const body = apiErrorBody(err);
        // Form values are kept on purpose: after the admin edits the rule, one click retries.
        if (body?.code === 'FRAUD_BLOCKED') {
          this.result.set({
            kind: 'blocked',
            message: body.message,
            rule: body.rule ? RULE_LABELS[body.rule] : 'Fraud rule',
          });
        } else {
          this.result.set({ kind: 'error', message: apiErrorMessage(err) });
        }
      },
    });
  }

  // One message per field, shown only once the user has left the field or pressed Send.
  errorFor(field: 'toUpiId' | 'amount' | 'note'): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !control.touched) return null;
    const e = control.errors ?? {};
    if (e['required']) return field === 'toUpiId' ? 'Enter the receiver\'s UPI id' : 'Enter an amount';
    if (e['pattern']) return 'Enter a UPI id like name@sandbox';
    if (e['min']) return 'The minimum is ₹1';
    if (e['max']) return 'The maximum is ₹1,00,000 per transfer';
    if (e['decimals']) return 'Use at most 2 decimal places';
    if (e['maxlength']) return 'Keep the note under 60 characters';
    return null;
  }
}
