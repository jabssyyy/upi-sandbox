import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/models/api-error';
import { AuthBrandPanel } from '../brand-panel/brand-panel';

// Same template-driven pattern as the login page, with two extra validators.
@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, AuthBrandPanel],
  templateUrl: './register.html',
  styleUrl: '../auth-layout.scss', // same split layout as the login page
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  model = { name: '', email: '', password: '' };

  // Signals, because the app is zoneless: setting them is what tells Angular to re-render.
  submitting = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);

  constructor() {
    if (this.auth.isLoggedIn()) this.router.navigate(['/wallet']);
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const { name, email, password } = this.model;
    // The server replies with a token that AuthService saves, so the user is logged in straight away.
    this.auth.register(name.trim(), email, password).subscribe({
      next: () => {
        this.toast.success('Account created. ₹1,00,000 of sandbox money added.');
        this.router.navigate(['/wallet']);
      },
      error: (err: unknown) => {
        this.serverError.set(apiErrorMessage(err)); // e.g. "This email is already registered"
        this.submitting.set(false);
      },
    });
  }
}
