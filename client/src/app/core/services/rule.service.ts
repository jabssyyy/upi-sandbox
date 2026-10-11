import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../api';
import { Rule, RuleKey, RuleUpdate, Stats } from '../models/rule';
import { Page, Transaction } from '../models/transaction';

// Everything the admin screens need. The server rejects these calls for non-admins.
@Injectable({ providedIn: 'root' })
export class RuleService {
  private http = inject(HttpClient);

  getRules(): Observable<Rule[]> {
    return this.http.get<{ rules: Rule[] }>(`${API_URL}/rules`).pipe(map((res) => res.rules));
  }

  updateRule(key: RuleKey, changes: RuleUpdate): Observable<Rule> {
    return this.http.put<{ rule: Rule }>(`${API_URL}/rules/${key}`, changes).pipe(map((res) => res.rule));
  }

  getBlocked(page = 1, limit = 20): Observable<Page<Transaction>> {
    return this.http.get<Page<Transaction>>(`${API_URL}/admin/blocked`, { params: { page, limit } });
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${API_URL}/admin/stats`);
  }
}
