import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/models/api-error';

// Template-driven form: the template owns the controls (ngModel), the class only holds the data.
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Plain object is fine here: ngModel writes into it on every keystroke.
  model = { email: '', password: '' };

  // Signals, because the app is zoneless: setting them is what tells Angular to re-render.
  submitting = signal(false);
  serverError = signal<string | null>(null);

  constructor() {
    // No point showing the login form to someone who already has a session.
    if (this.auth.isLoggedIn()) this.router.navigate(['/wallet']);
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return; // form.submitted is now true, so the field errors appear

    this.submitting.set(true);
    this.serverError.set(null);

    this.auth.login(this.model.email, this.model.password).subscribe({
      next: () => this.router.navigate(['/wallet']),
      error: (err: unknown) => {
        this.serverError.set(apiErrorMessage(err));
        this.submitting.set(false);
      },
    });
  }
}
