import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="card empty-state">
      <h1 class="page-title">Page not found</h1>
      <p class="muted">There is nothing at this address.</p>
      <a class="btn btn-primary" routerLink="/wallet">Go to your wallet</a>
    </div>
  `,
})
export class NotFoundPage {}
