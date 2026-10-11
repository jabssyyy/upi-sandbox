import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

// Rendered once in the app shell; shows whatever ToastService holds.
@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toastService.toasts(); track t.id) {
        <div [class]="'toast toast-' + t.kind" role="status">
          <span class="toast-icon" aria-hidden="true">{{ t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : 'i' }}</span>
          <span class="toast-text">{{ t.message }}</span>
          <button type="button" class="toast-close" aria-label="Dismiss" (click)="toastService.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: min(360px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-left: 4px solid var(--primary);
      border-radius: var(--radius-sm);
      box-shadow: 0 8px 24px rgb(0 0 0 / 15%);
      animation: toast-in 0.2s ease-out;
    }
    .toast-success { border-left-color: var(--success); }
    .toast-error { border-left-color: var(--danger); }
    .toast-icon {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--on-primary);
      background: var(--primary);
      flex-shrink: 0;
    }
    .toast-success .toast-icon { background: var(--success); }
    .toast-error .toast-icon { background: var(--danger); }
    .toast-text { flex: 1; font-size: 0.9rem; }
    .toast-close {
      border: none;
      background: none;
      color: var(--muted);
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }
  `,
})
export class Toasts {
  protected toastService = inject(ToastService);
}
