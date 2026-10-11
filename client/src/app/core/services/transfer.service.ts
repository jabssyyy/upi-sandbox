import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api';
import { HistoryFilters, Page, Transaction, TransferRequest, TransferResult } from '../models/transaction';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private http = inject(HttpClient);

  send(request: TransferRequest): Observable<TransferResult> {
    return this.http.post<TransferResult>(`${API_URL}/transfers`, request);
  }

  list(filters: HistoryFilters = {}): Observable<Page<Transaction>> {
    // Only send the filters that are actually set: ?status=blocked&page=2
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<Page<Transaction>>(`${API_URL}/transfers`, { params });
  }

  // Finds the receiver's name before sending. 404 if nobody has that UPI id.
  lookup(upiId: string): Observable<{ name: string; upiId: string }> {
    return this.http.get<{ name: string; upiId: string }>(`${API_URL}/users/lookup`, {
      params: { upiId },
    });
  }
}
