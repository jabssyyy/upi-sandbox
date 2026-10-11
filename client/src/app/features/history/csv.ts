import { formatDate } from '@angular/common';
import { Transaction } from '../../core/models/transaction';
import { RULE_LABELS } from '../../shared/receipt/rule-labels';

const HEADERS = ['Date', 'Direction', 'Counterpart', 'UPI ID', 'Amount (INR)', 'Status', 'Rule', 'Reason', 'Note'];

// A cell with a comma, quote or line break must be wrapped in quotes,
// and any quote inside it doubled: He said "hi"  ->  "He said ""hi"""
// A leading ' stops Excel running a note like "=HYPERLINK(...)" as a formula (CSV injection).
function csvCell(raw: string): string {
  const value = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toRow(t: Transaction): string[] {
  const sent = t.direction === 'sent';
  const other = sent ? t.to : t.from;
  return [
    formatDate(t.createdAt, 'yyyy-MM-dd HH:mm', 'en-IN'), // local time, sorts correctly as text
    sent ? 'Sent' : 'Received',
    other.name,
    other.upiId,
    String(t.amount / 100), // paise -> plain rupees for spreadsheets: 200050 -> "2000.5"
    t.status,
    t.ruleHit ? RULE_LABELS[t.ruleHit.key] : '',
    t.ruleHit?.reason ?? '',
    t.note ?? '',
  ];
}

export function transactionsToCsv(rows: Transaction[]): string {
  const lines = [HEADERS, ...rows.map(toRow)].map((cells) => cells.map(csvCell).join(','));
  return lines.join('\r\n'); // CSV files use Windows line endings by convention
}

// Browsers can only "download" a URL, so we wrap the text in a Blob, give it a
// temporary URL and click a hidden <a download> link pointing at it.
export function downloadCsv(csv: string, filename: string): void {
  // The BOM tells Excel the file is UTF-8, so names like "Zoë" survive.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // free the memory once the download has started
}
