import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from './shared/nav-bar/nav-bar';

// The app shell: nav bar on top, and the current page swapped in below by the router.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBar],
  template: `
    <app-nav-bar />
    <main class="container">
      <router-outlet />
    </main>
  `,
})
export class App {}
