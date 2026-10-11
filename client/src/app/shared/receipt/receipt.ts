import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Transaction } from '../../core/models/transaction';
import { UserRef } from '../../core/models/user';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadge } from '../status-badge/status-badge';
import { RULE_LABELS } from './rule-labels';

// <app-receipt [transaction]="t" (closed)="selected.set(null)" />
// A pop-up with every detail of one transaction.
@Component({
  selector: 'app-receipt',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge],
  templateUrl: './receipt.html',
  styleUrl: './receipt.scss',
})
export class Receipt implements AfterViewInit {
  // @Input: data flows IN from the parent. @Output: events flow back OUT to it.
  @Input({ required: true }) transaction!: Transaction;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  private toast = inject(ToastService);

  protected get sent(): boolean {
    return this.transaction.direction === 'sent';
  }

  // The person on the other side of the transfer.
  protected get other(): UserRef {
    return this.sent ? this.transaction.to : this.transaction.from;
  }

  protected get ruleLabel(): string {
    const hit = this.transaction.ruleHit;
    return hit ? RULE_LABELS[hit.key] : 'a fraud rule';
  }

  // Keyboard users land inside the dialog, so Enter or Escape works straight away.
  ngAfterViewInit(): void {
    this.closeButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }

  // Only a click on the dark area closes; clicks inside the card bubble up with a different target.
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  async copyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.transaction._id);
      this.toast.success('Transaction id copied');
    } catch {
      // Clipboard can be blocked by the browser; the id is still on screen to copy by hand.
    }
  }
}
