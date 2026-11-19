import type { Invoice } from '../types';

/** UK standard rate. Every price typed into the app already includes it. */
export const VAT_RATE = 0.2;

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export const formatMoney = (pence: number) => gbp.format(pence / 100);

export const toPence = (pounds: number) => Math.round((Number.isFinite(pounds) ? pounds : 0) * 100);

/** Splits a VAT-inclusive amount (in pence) into net + VAT. */
export function splitGross(grossPence: number) {
  const net = Math.round(grossPence / (1 + VAT_RATE));
  return { net, vat: grossPence - net };
}

export interface LineTotals {
  id: string;
  unitNet: number;
  unitGross: number;
  net: number;
  vat: number;
  gross: number;
}

export interface Totals {
  lines: LineTotals[];
  subtotal: number; // net, ex VAT
  vat: number;
  total: number; // gross, inc VAT
  paid: number;
  balance: number;
}

/**
 * All amounts are worked out in whole pence so the invoice always adds up:
 * line nets sum to the subtotal, and subtotal + VAT equals exactly what was typed.
 */
export function calcTotals(inv: Pick<Invoice, 'items' | 'status' | 'amountPaid'>): Totals {
  const lines = inv.items.map((it) => {
    const qty = Number.isFinite(it.qty) ? it.qty : 0;
    const unitGross = toPence(it.price);
    const unitNet = splitGross(unitGross).net;
    // Line net is built from the printed unit price so "qty × unit price = amount" always holds;
    // VAT takes whatever is left so the line still totals exactly what was typed.
    const gross = Math.round(qty * unitGross);
    const net = Math.round(qty * unitNet);
    return { id: it.id, unitGross, unitNet, net, vat: gross - net, gross };
  });
  const subtotal = lines.reduce((s, l) => s + l.net, 0);
  const vat = lines.reduce((s, l) => s + l.vat, 0);
  const total = subtotal + vat;
  const paid =
    inv.status === 'paid' ? total : inv.status === 'partial' ? Math.min(total, Math.max(0, toPence(inv.amountPaid))) : 0;
  return { lines, subtotal, vat, total, paid, balance: total - paid };
}
