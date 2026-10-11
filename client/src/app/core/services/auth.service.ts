import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from '../api';
import { AuthResponse, User } from '../models/user';

const TOKEN_KEY = 'upi_token';
const USER_KEY = 'upi_user';

function readStoredUser(): User | null {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null; // a profile without a token is not a session
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // A signal: any template or computed() that reads it updates when it changes.
  private readonly currentUser = signal<User | null>(readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((res) => this.saveSession(res)), map((res) => res.user));
  }

  register(name: string, email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, { name, email, password })
      .pipe(tap((res) => this.saveSession(res)), map((res) => res.user));
  }

  // Re-reads the profile from the server, e.g. to show a fresh balance.
  refreshProfile(): Observable<User> {
    return this.http.get<{ user: User }>(`${API_URL}/auth/me`).pipe(
      map((res) => res.user),
      tap((user) => this.setUser(user)),
    );
  }

  // After a transfer or top-up the server sends the new balance; keep the nav bar in sync.
  setBalance(balance: number): void {
    const user = this.currentUser();
    if (user) this.setUser({ ...user, balance });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.setUser(res.user);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }
}
