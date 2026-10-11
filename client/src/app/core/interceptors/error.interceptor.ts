import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// If the server says 401 (token missing, expired or invalid), log out and go to /login.
// Login and register are skipped: there a 401 just means "wrong password", shown on the form.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      const isLoginCall = /\/auth\/(login|register)$/.test(req.url);
      if (err instanceof HttpErrorResponse && err.status === 401 && !isLoginCall) {
        auth.logout();
      }
      return throwError(() => err); // still let the component see the error
    }),
  );
};
