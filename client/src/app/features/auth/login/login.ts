import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/models/api-error';
import { User } from '../../../core/models/user';
import { AuthBrandPanel } from '../brand-panel/brand-panel';

// Seeded demo accounts all share this password (see the server seed script).
const DEMO_PASSWORD = 'Password@123';

// Template-driven form: the template owns the controls (ngModel), the class only holds the data.
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthBrandPanel],
  templateUrl: './login.html',
  styleUrl: '../auth-layout.scss',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Plain object is fine here: ngModel writes into it on every keystroke.
  model = { email: '', password: '' };

  // Signals, because the app is zoneless: setting them is what tells Angular to re-render.
  submitting = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    // No point showing the login form to someone who already has a session.
    if (this.auth.isLoggedIn()) this.router.navigate(['/wallet']);
  }

  // Saves typing in the live demo. ngModel picks up the new values on the next render.
  fillDemo(email: string): void {
    this.model = { email, password: DEMO_PASSWORD };
    this.serverError.set(null);
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return; // form.submitted is now true, so the field errors appear

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth.login(this.model.email, this.model.password).subscribe({
      next: (user: User) => {
        const firstName = user.name.split(' ')[0];
        this.toast.success(`Welcome back, ${firstName}`);
        this.router.navigate(['/wallet']);
      },
      error: (err: unknown) => {
        this.serverError.set(apiErrorMessage(err));
        this.submitting.set(false);
      },
    });
  }
}
