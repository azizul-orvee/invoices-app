import { pdf } from '@react-pdf/renderer';
import { createElement } from 'react';
import type { Invoice, Profile } from '../types';
import { calcTotals } from '../lib/money';
import { InvoiceDocument, type LogoAsset } from './InvoiceDocument';
import { registerFonts } from './fonts';

const logoCache = new Map<string, Promise<LogoAsset | null>>();

/** Logo box on the invoice: at most 190×58pt, aspect ratio kept. */
function measureLogo(src: string): Promise<LogoAsset | null> {
  if (!src) return Promise.resolve(null);
  const cached = logoCache.get(src);
  if (cached) return cached;
  const p = new Promise<LogoAsset | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      const scale = Math.min(190 / w, 58 / h);
      const abs = src.startsWith('data:') ? src : new URL(src, window.location.href).href;
      resolve({ src: abs, width: w * scale, height: h * scale });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  logoCache.set(src, p);
  return p;
}

export async function renderInvoicePdf(profile: Profile, invoice: Invoice): Promise<Blob> {
  registerFonts();
  const logo = await measureLogo(profile.logo);
  const totals = calcTotals(invoice);
  return pdf(createElement(InvoiceDocument, { profile, invoice, totals, logo }) as never).toBlob();
}
