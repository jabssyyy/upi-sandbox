import { Component } from '@angular/core';

// The coloured left half of the login and register pages.
// One small component so both pages show the same brand panel without copy-pasting it.
@Component({
  selector: 'app-auth-brand-panel',
  template: `
    <p class="sandbox-tag">Sandbox · fake money only</p>
    <h2 class="brand-name">UPI Sandbox</h2>
    <p class="tagline">Practice digital payments with fake money and a live fraud engine.</p>

    <ul class="features">
      <li>₹1,00,000 of sandbox money to start</li>
      <li>Every transfer checked by fraud rules</li>
      <li>Admins change rules live, no restart</li>
    </ul>

    <!-- Pure decoration, so screen readers skip it. -->
    <div class="mock-card" aria-hidden="true">
      <div class="mock-row">
        <span class="mock-chip"></span>
        <span>Sandbox wallet</span>
      </div>
      <div class="mock-balance">₹1,00,000.00</div>
      <div class="mock-upi">you&#64;sandbox</div>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 40px 36px;
      color: var(--on-primary);
      background: linear-gradient(145deg, var(--primary), var(--primary-hover));
    }
    /* Two soft circles in the corners give depth without any images. */
    :host::before,
    :host::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgb(255 255 255 / 10%);
      pointer-events: none;
    }
    :host::before { width: 260px; height: 260px; top: -110px; right: -90px; }
    :host::after { width: 180px; height: 180px; bottom: -70px; left: -60px; }

    .sandbox-tag {
      align-self: flex-start;
      margin: 0;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgb(255 255 255 / 18%);
      font-size: 0.75rem;
      font-weight: 650;
    }
    .brand-name { font-size: 1.9rem; font-weight: 800; margin: 4px 0 0; }
    .tagline { margin: 0; opacity: 0.9; }

    .features { list-style: none; padding: 0; margin: 12px 0; display: grid; gap: 10px; }
    .features li { display: flex; align-items: center; gap: 10px; font-weight: 550; }
    .features li::before {
      content: '✓';
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgb(255 255 255 / 20%);
      font-size: 0.75rem;
    }

    .mock-card {
      margin-top: auto;
      max-width: 300px;
      padding: 18px 20px;
      border-radius: var(--radius);
      border: 1px solid rgb(255 255 255 / 25%);
      background: rgb(255 255 255 / 14%);
      transform: rotate(-3deg);
    }
    .mock-row { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; opacity: 0.9; }
    .mock-chip { width: 30px; height: 22px; border-radius: 5px; background: rgb(255 255 255 / 35%); }
    .mock-balance { font-size: 1.5rem; font-weight: 750; margin: 14px 0 2px; font-variant-numeric: tabular-nums; }
    .mock-upi { font-size: 0.85rem; opacity: 0.85; }

    /* Phones: just a compact header above the form. */
    @media (max-width: 759.98px) {
      :host { padding: 22px 20px; gap: 6px; }
      .brand-name { font-size: 1.4rem; }
      .tagline { font-size: 0.9rem; }
      .features,
      .mock-card { display: none; }
    }
  `,
})
export class AuthBrandPanel {}
