import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RuleService } from '../../../core/services/rule.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnyRule, RuleKey, RuleParamsByKey } from '../../../core/models/rule';
import { rupeesToPaise } from '../../../core/models/money';
import { apiErrorMessage } from '../../../core/models/api-error';
import { RULE_DESCRIPTIONS } from '../rule-text';
import { RuleSimulator } from './rule-simulator/rule-simulator';

// The controls of each kind of form. Number inputs give null when empty, hence "| null".
type MoneyFields = { enabled: FormControl<boolean>; maxAmount: FormControl<number | null> };
type VelocityFields = {
  enabled: FormControl<boolean>;
  maxCount: FormControl<number | null>;
  windowSeconds: FormControl<number | null>;
};

// What one card needs besides its form. These are signals because the app is zoneless:
// the template only re-renders when a signal it reads changes.
interface CardState {
  rule: WritableSignal<AnyRule>;
  saving: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
}

// "kind" tells TypeScript (and the template) which fields this card's form has.
type RuleCard =
  | (CardState & { kind: 'money'; form: FormGroup<MoneyFields> })
  | (CardState & { kind: 'velocity'; form: FormGroup<VelocityFields> });

// Rupees: at least 1, at most 2 decimals (paise are whole numbers).
const RUPEES = [Validators.required, Validators.min(1), Validators.pattern(/^\d+(\.\d{1,2})?$/)];
// Counts and seconds: whole numbers, at least 1. Same rules the server checks.
const WHOLE = [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)];

@Component({
  selector: 'app-admin-rules',
  imports: [ReactiveFormsModule, DatePipe, RuleSimulator],
  templateUrl: './admin-rules.html',
  styleUrl: './admin-rules.scss',
})
export class AdminRulesPage implements OnInit {
  private ruleService = inject(RuleService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly descriptions = RULE_DESCRIPTIONS;

  cards = signal<RuleCard[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.ruleService.getRules().subscribe({
      next: (rules) => {
        this.cards.set(rules.map((rule) => this.toCard(rule)));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loadError.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  save(card: RuleCard): void {
    if (card.form.invalid || card.saving()) return;
    card.saving.set(true);
    card.error.set(null);

    const changes = { enabled: card.form.controls.enabled.value, params: this.paramsOf(card) };
    this.ruleService.updateRule(card.rule().key, changes).subscribe({
      next: (updated) => {
        // The form already holds what was saved, so it just stops being "changed".
        card.form.markAsPristine();
        card.rule.set(updated);
        card.saving.set(false);
        this.toast.success(`${updated.name} saved. It applies to the next transfer.`);
      },
      error: (err: unknown) => {
        card.error.set(apiErrorMessage(err));
        card.saving.set(false);
      },
    });
  }

  // Builds one card (form + state) from a rule document.
  private toCard(rule: AnyRule): RuleCard {
    const state: CardState = {
      rule: signal(rule),
      saving: signal(false),
      error: signal(null),
    };
    const enabled = this.fb.nonNullable.control(rule.enabled);

    // params has a different shape per rule. Checking the key narrows the type,
    // so inside this if TypeScript knows params is { maxCount, windowSeconds }.
    if (rule.key === 'VELOCITY') {
      const form = this.fb.group({
        enabled,
        maxCount: this.fb.control<number | null>(rule.params.maxCount, WHOLE),
        windowSeconds: this.fb.control<number | null>(rule.params.windowSeconds, WHOLE),
      });
      return { ...state, kind: 'velocity', form };
    }

    // The server stores paise; the admin edits rupees.
    const form = this.fb.group({
      enabled,
      maxAmount: this.fb.control<number | null>(rule.params.maxAmount / 100, RUPEES),
    });
    return { ...state, kind: 'money', form };
  }

  // The params in the server's units. Only called when the form is valid, so values are not null.
  private paramsOf(card: RuleCard): RuleParamsByKey[RuleKey] {
    if (card.kind === 'money') {
      return { maxAmount: rupeesToPaise(Number(card.form.controls.maxAmount.value)) };
    }
    const { maxCount, windowSeconds } = card.form.getRawValue();
    return { maxCount: Number(maxCount), windowSeconds: Number(windowSeconds) };
  }
}
