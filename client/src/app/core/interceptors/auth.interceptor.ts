import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../api';
import { AuthService } from '../services/auth.service';

// Runs on every HttpClient request. Adds "Authorization: Bearer <token>" for our API,
// so no service ever has to remember to do it.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;
  if (!token || !req.url.startsWith(API_URL)) return next(req);

  // Requests are immutable: clone it with the extra header.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
