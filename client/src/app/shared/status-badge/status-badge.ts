import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TransactionStatus } from '../../core/models/transaction';

// <app-status-badge [status]="t.status" />  ->  green "Success" or red "Blocked"
@Component({
  selector: 'app-status-badge',
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="{ 'badge-success': status === 'success', 'badge-danger': status === 'blocked' }">
      {{ status === 'success' ? 'Success' : 'Blocked' }}
    </span>
  `,
})
export class StatusBadge {
  // @Input: the parent passes a value in through property binding [status]="...".
  @Input({ required: true }) status!: TransactionStatus;
}
