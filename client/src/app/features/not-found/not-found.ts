import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Shown for any URL the route table does not know (the '**' route).
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="card not-found">
      <!-- The big number is decoration; the heading below says the same thing in words. -->
      <p class="code" aria-hidden="true">404</p>
      <h1 class="page-title">Page not found</h1>
      <p class="muted">This page does not exist, but your sandbox wallet does.</p>
      <a class="btn btn-primary" routerLink="/wallet">Go to your wallet</a>
    </div>
  `,
  styles: `
    .not-found {
      max-width: 460px;
      margin: 40px auto;
      padding: 40px 24px;
      text-align: center;
    }
    /* Gradient text: paint the gradient as a background, then clip it to the letters. */
    .code {
      margin: 0 0 8px;
      font-size: clamp(4.5rem, 20vw, 7rem);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.04em;
      background: linear-gradient(145deg, var(--primary), var(--primary-hover));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .muted { margin: 0 0 24px; }
  `,
})
export class NotFoundPage {}
