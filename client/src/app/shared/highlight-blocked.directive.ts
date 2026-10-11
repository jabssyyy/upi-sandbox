import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';
import { TransactionStatus } from '../core/models/transaction';

// An attribute directive: adds behaviour to an existing element instead of creating a new one.
// <tr [appHighlightBlocked]="t.status">  tints the row red when the status is 'blocked'.
@Directive({ selector: '[appHighlightBlocked]' })
export class HighlightBlocked implements OnChanges {
  @Input('appHighlightBlocked') status: TransactionStatus | null = null;

  // ElementRef gives direct access to the real DOM element the directive sits on.
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnChanges(): void {
    const blocked = this.status === 'blocked';
    this.el.nativeElement.style.backgroundColor = blocked ? 'var(--danger-tint)' : '';
    this.el.nativeElement.style.boxShadow = blocked ? 'inset 3px 0 0 var(--danger)' : '';
  }
}
