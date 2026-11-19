import type { Invoice, LineItem, Profile } from '../types';
import { addDaysISO, todayISO } from './dates';
import { uid } from './storage';

export const newItem = (description = '', price = 0): LineItem => ({
  id: uid(),
  description,
  detail: '',
  qty: 1,
  price,
});

/** e.g. INV-2026-1118-01 — prefix, year, month+day, then a running number for that day. */
export function nextInvoiceNumber(profile: Profile, history: Invoice[], issueDate = todayISO()) {
  const [y, m, d] = issueDate.split('-');
  const prefix = (profile.invoicePrefix || 'INV').trim().toUpperCase();
  const stem = `${prefix}-${y}-${m}${d}-`;
  const used = new Set(history.filter((h) => h.number.startsWith(stem)).map((h) => h.number));
  let n = 1;
  while (used.has(stem + String(n).padStart(2, '0'))) n++;
  return stem + String(n).padStart(2, '0');
}

export function newInvoice(profile: Profile, history: Invoice[]): Invoice {
  const issueDate = todayISO();
  return {
    id: uid(),
    profileId: profile.id,
    number: nextInvoiceNumber(profile, history, issueDate),
    issueDate,
    dueDate: addDaysISO(issueDate, profile.paymentTermsDays || 0),
    customer: { name: '', contact: '', email: '', phone: '', address: '' },
    vehicleReg: '',
    reference: '',
    items: [newItem()],
    status: 'paid',
    method: 'card',
    amountPaid: 0,
    notes: profile.defaultNote,
  };
}

export const METHOD_LABEL: Record<Invoice['method'], string> = {
  card: 'card',
  cash: 'cash',
  bank: 'bank transfer',
  other: 'other',
};

export function fileNameFor(profile: Profile, inv: Invoice) {
  const clean = (str: string, keep = '') =>
    str
      .trim()
      .replace(new RegExp(`[^\\p{L}\\p{N}${keep}]+`, 'gu'), '_')
      .replace(/^_+|_+$/g, '');
  return (
    [clean(profile.companyName || profile.label || 'Invoice'), 'Invoice', clean(inv.customer.name), clean(inv.number, '\\-')]
      .filter(Boolean)
      .join('_') + '.pdf'
  );
}
