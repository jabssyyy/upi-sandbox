import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './shared/nav-bar/nav-bar';
import { Toasts } from './shared/toasts/toasts';
import { ThemeService } from './core/services/theme.service';

// The app shell: nav bar on top, the current page swapped in below by the router,
// and the toast messages floating in the corner.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar, Toasts],
  template: `
    <app-nav-bar />
    <main class="container">
      <router-outlet />
    </main>
    <app-toasts />
  `,
})
export class App {
  // Injecting it here creates it at startup, so the saved theme applies before anything renders.
  private theme = inject(ThemeService);
}
