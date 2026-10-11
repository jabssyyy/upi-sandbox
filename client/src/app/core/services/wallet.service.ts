import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { Wallet } from '../models/user';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);

  getWallet(): Observable<Wallet> {
    return this.http.get<Wallet>(`${API_URL}/wallet`);
  }

  // amount in paise, at most ₹50,000 (5000000) per call
  topup(amount: number): Observable<{ balance: number }> {
    return this.http.post<{ balance: number }>(`${API_URL}/wallet/topup`, { amount });
  }
}
