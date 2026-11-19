import type { ComponentProps } from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Invoice, Profile } from '../types';
import type { Totals } from '../lib/money';
import { formatMoney, VAT_RATE } from '../lib/money';
import { formatDate } from '../lib/dates';
import { METHOD_LABEL } from '../lib/invoice';
import { mix, onColor, readableOnWhite } from '../lib/color';

export interface LogoAsset {
  src: string;
  width: number;
  height: number;
}

interface Props {
  profile: Profile;
  invoice: Invoice;
  totals: Totals;
  logo: LogoAsset | null;
}

const BASE_SIZE = 8.75;
const INK = '#14161B';
const INK_2 = '#4A4F5B';
const MUTED = '#8B909B';
const LINE = '#E7E8EB';

const s = StyleSheet.create({
  page: {
    fontFamily: 'Jakarta',
    fontSize: BASE_SIZE,
    color: INK,
    paddingTop: 50,
    paddingBottom: 86,
    paddingHorizontal: 48,
  },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  row: { flexDirection: 'row' },
  label: {
    fontSize: 6.75,
    fontWeight: 700,
    letterSpacing: 1.3,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  strong: { fontWeight: 700, color: INK },
  body: { color: INK_2 },
  mono: { fontFamily: 'Mono' },
  metaRow: { flexDirection: 'row', marginBottom: 3.5 },
  metaLabel: { width: 82, color: MUTED },
  metaValue: { color: INK, fontWeight: 500 },
  th: {
    fontSize: 6.75,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: MUTED,
    textTransform: 'uppercase',
  },
  num: { textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  footer: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 30,
    paddingTop: 12,
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.25,
    color: MUTED,
  },
});

/**
 * Text with the document's base size and line height. Both are set on every Text on purpose:
 * react-pdf hides fixed footers when lineHeight is on the Page, and resolves a unitless
 * lineHeight against its 18pt default when fontSize is only inherited.
 * Use plain <Text> for spans nested inside a T so they inherit the parent's size.
 */
function T({ style, ...rest }: ComponentProps<typeof Text>) {
  const list = Array.isArray(style) ? style : style ? [style] : [];
  // `as never`: react-pdf's Text typings union in SVG props, which a merged style array can't satisfy.
  return <Text {...rest} style={[{ fontSize: BASE_SIZE, lineHeight: 1.45 }, ...list] as never} />;
}

const STATUS = {
  paid: { text: 'Paid', bg: '#E6F5EC', fg: '#13773A' },
  partial: { text: 'Part paid', bg: '#E9F0FF', fg: '#1D55C9' },
  unpaid: { text: 'Due', bg: '#FFF2DF', fg: '#A75A06' },
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || 'IN').slice(0, 2)).toUpperCase();
}

function lines(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function Pill({ status }: { status: Invoice['status'] }) {
  const st = STATUS[status];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: st.bg,
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 9,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: st.fg, marginRight: 5 }} />
      <T style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.1, color: st.fg, textTransform: 'uppercase', lineHeight: 1.2 }}>
        {st.text}
      </T>
    </View>
  );
}

function Plate({ reg }: { reg: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: '#FFD338',
        borderRadius: 3,
        borderWidth: 0.9,
        borderColor: '#14161B',
        paddingVertical: 3,
        paddingHorizontal: 8,
      }}
    >
      <T style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, color: '#14161B', lineHeight: 1.2 }}>{reg.toUpperCase()}</T>
    </View>
  );
}

export function InvoiceDocument({ profile, invoice, totals, logo }: Props) {
  const brand = profile.brandColor || INK;
  const brandText = readableOnWhite(brand);
  const panel = mix(brand, 0.055);
  const onBrand = onColor(brand);
  const c = invoice.customer;
  const vatPct = `${Math.round(VAT_RATE * 100)}%`;
  const method = METHOD_LABEL[invoice.method];
  const hasBank = Boolean(profile.bankAccountNumber || profile.bankSortCode);
  const company = profile.companyName || profile.label || 'Your company';

  const statement =
    invoice.status === 'paid'
      ? { amount: formatMoney(totals.total), tail: `paid in full`, sub: `Received by ${method} on ${formatDate(invoice.issueDate)}` }
      : invoice.status === 'partial'
        ? {
            amount: formatMoney(totals.balance),
            tail: `due ${formatDate(invoice.dueDate)}`,
            sub: `${formatMoney(totals.paid)} received by ${method} · ${formatMoney(totals.total)} invoice total`,
          }
        : {
            amount: formatMoney(totals.balance),
            tail: `due ${formatDate(invoice.dueDate)}`,
            sub: hasBank ? 'Payment details are listed below' : `Invoice total including VAT`,
          };

  const fromLines = [
    ...lines(profile.address),
    [profile.phone && `Tel ${profile.phone}`, profile.mobile && `Mob ${profile.mobile}`].filter(Boolean).join('  ·  '),
    profile.email,
    profile.website,
  ].filter(Boolean) as string[];

  const billLines = [c.contact, ...lines(c.address), c.email, c.phone].filter(Boolean) as string[];

  const legal = [
    company,
    profile.vatNumber && `VAT No. ${profile.vatNumber}`,
    profile.companyNumber && `Company No. ${profile.companyNumber}`,
  ]
    .filter(Boolean)
    .join('   ·   ');

  const items = invoice.items.filter((it) => it.description.trim() || it.price);

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={company}
      subject={`Invoice ${invoice.number} — ${c.name || 'Customer'}`}
      creator={company}
      producer={company}
    >
      <Page size="A4" style={s.page}>
        <View fixed style={[s.topBar, { backgroundColor: brand }]} />
        {/* ── Footer ─────────────────────────────────────────── */}
        <View fixed style={s.footer}>
          <Text style={{ flex: 1, paddingRight: 16 }}>{legal}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${invoice.number}   ·   Page ${pageNumber} of ${totalPages}`}
          />
        </View>

        <View>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View>
            <T style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1.1, color: INK }}>Invoice</T>
            <View style={{ marginTop: 14 }}>
              <View style={s.metaRow}>
                <T style={s.metaLabel}>Invoice number</T>
                <T style={[s.metaValue, s.mono]}>{invoice.number}</T>
              </View>
              <View style={s.metaRow}>
                <T style={s.metaLabel}>Date of issue</T>
                <T style={s.metaValue}>{formatDate(invoice.issueDate)}</T>
              </View>
              <View style={s.metaRow}>
                <T style={s.metaLabel}>Date due</T>
                <T style={s.metaValue}>{formatDate(invoice.dueDate)}</T>
              </View>
              {invoice.reference ? (
                <View style={s.metaRow}>
                  <T style={s.metaLabel}>Reference</T>
                  <T style={s.metaValue}>{invoice.reference}</T>
                </View>
              ) : null}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', maxWidth: 220 }}>
            {logo ? (
              <Image src={logo.src} style={{ width: logo.width, height: logo.height }} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <T style={{ color: onBrand, fontSize: 13, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2 }}>{initials(company)}</T>
                </View>
                <View style={{ maxWidth: 170 }}>
                  <T style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.15 }}>{company}</T>
                  {profile.tagline ? (
                    <T style={{ fontSize: 7, fontWeight: 600, color: MUTED, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 2 }}>
                      {profile.tagline}
                    </T>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Parties ────────────────────────────────────────── */}
        <View style={[s.row, { marginTop: 28 }]}>
          <View style={{ flex: 1, paddingRight: 18 }}>
            <T style={s.label}>From</T>
            <T style={[s.strong, { fontSize: 9.5, marginBottom: 2 }]}>{company}</T>
            {fromLines.map((l, i) => (
              <T key={i} style={s.body}>
                {l}
              </T>
            ))}
            {profile.vatNumber ? <T style={[s.body, { marginTop: 3 }]}>VAT No. {profile.vatNumber}</T> : null}
          </View>
          <View style={{ flex: 1, paddingRight: 18 }}>
            <T style={s.label}>Bill to</T>
            <T style={[s.strong, { fontSize: 9.5, marginBottom: 2 }]}>{c.name || '—'}</T>
            {billLines.map((l, i) => (
              <T key={i} style={s.body}>
                {l}
              </T>
            ))}
          </View>
          {invoice.vehicleReg ? (
            <View style={{ width: 110 }}>
              <T style={s.label}>Vehicle</T>
              <Plate reg={invoice.vehicleReg} />
            </View>
          ) : null}
        </View>

        {/* ── Statement ──────────────────────────────────────── */}
        <View
          style={{
            marginTop: 24,
            backgroundColor: panel,
            borderRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <T style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15 }}>
              <Text style={{ color: brandText }}>{statement.amount}</Text>
              <Text style={{ color: INK }}> {statement.tail}</Text>
            </T>
            <T style={{ color: INK_2, marginTop: 4 }}>{statement.sub}</T>
          </View>
          <Pill status={invoice.status} />
        </View>

        {/* ── Line items ─────────────────────────────────────── */}
        <View style={{ marginTop: 26 }}>
          <View fixed style={[s.row, { paddingBottom: 8, borderBottomWidth: 1.25, borderBottomColor: INK }]}>
            <T style={[s.th, { flex: 1 }]}>Description</T>
            <T style={[s.th, s.num, { width: 44 }]}>Qty</T>
            <T style={[s.th, s.num, { width: 88 }]}>Unit price</T>
            <T style={[s.th, s.num, { width: 88 }]}>Amount</T>
          </View>
          {items.map((it, idx) => {
            const t = totals.lines.find((l) => l.id === it.id);
            return (
              <View
                key={it.id}
                wrap={false}
                style={[s.row, { paddingVertical: 10, borderBottomWidth: 0.75, borderBottomColor: LINE, alignItems: 'flex-start' }]}
              >
                <View style={{ flex: 1, paddingRight: 12, flexDirection: 'row' }}>
                  <T style={[s.mono, { color: MUTED, width: 20, fontSize: 7.5, paddingTop: 1.5 }]}>
                    {String(idx + 1).padStart(2, '0')}
                  </T>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontSize: 9.5, fontWeight: 600 }}>{it.description || 'Item'}</T>
                    {it.detail ? <T style={{ color: MUTED, marginTop: 2 }}>{it.detail}</T> : null}
                  </View>
                </View>
                <T style={[s.num, { width: 44, fontSize: 9.5, color: INK_2 }]}>{it.qty}</T>
                <T style={[s.num, { width: 88, fontSize: 9.5, color: INK_2 }]}>{formatMoney(t?.unitNet ?? 0)}</T>
                <T style={[s.num, { width: 88, fontSize: 9.5, fontWeight: 600 }]}>{formatMoney(t?.net ?? 0)}</T>
              </View>
            );
          })}
          <T style={{ fontSize: 7, color: MUTED, marginTop: 7 }}>Unit prices and amounts are shown excluding VAT.</T>
        </View>

        {/* ── Payment + totals ───────────────────────────────── */}
        <View wrap={false} style={[s.row, { marginTop: 20, alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, paddingRight: 36 }}>
            <T style={s.label}>Payment</T>
            {invoice.status === 'paid' ? (
              <T style={s.body}>
                Paid in full by {method} on {formatDate(invoice.issueDate)}. No further payment is required.
              </T>
            ) : (
              <T style={s.body}>
                {invoice.status === 'partial'
                  ? `${formatMoney(totals.paid)} received by ${method}. The remaining ${formatMoney(totals.balance)} is due by ${formatDate(invoice.dueDate)}.`
                  : `Please pay ${formatMoney(totals.balance)} by ${formatDate(invoice.dueDate)}.`}
              </T>
            )}

            {invoice.status !== 'paid' && hasBank ? (
              <View style={{ marginTop: 10, borderWidth: 0.75, borderColor: LINE, borderRadius: 8, padding: 10 }}>
                {[
                  ['Account name', profile.bankAccountName || company],
                  ['Sort code', profile.bankSortCode],
                  ['Account no.', profile.bankAccountNumber],
                  ['Reference', invoice.number],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <View key={k} style={[s.row, { marginBottom: 2 }]}>
                      <T style={{ width: 74, color: MUTED }}>{k}</T>
                      <T style={[{ fontWeight: 600 }, k !== 'Account name' ? s.mono : {}]}>{v}</T>
                    </View>
                  ))}
              </View>
            ) : null}

            {invoice.notes ? <T style={[s.body, { marginTop: 12 }]}>{invoice.notes}</T> : null}
          </View>

          <View style={{ width: 232 }}>
            <View style={s.totalsRow}>
              <T style={{ color: INK_2 }}>Subtotal (excl. VAT)</T>
              <T style={{ fontWeight: 500 }}>{formatMoney(totals.subtotal)}</T>
            </View>
            <View style={s.totalsRow}>
              <T style={{ color: INK_2 }}>VAT ({vatPct})</T>
              <T style={{ fontWeight: 500 }}>{formatMoney(totals.vat)}</T>
            </View>
            <View style={[s.totalsRow, { borderTopWidth: 0.75, borderTopColor: LINE, marginTop: 3, paddingTop: 8 }]}>
              <T style={{ fontWeight: 700 }}>Total (incl. VAT)</T>
              <T style={{ fontWeight: 700 }}>{formatMoney(totals.total)}</T>
            </View>
            {totals.paid > 0 ? (
              <View style={s.totalsRow}>
                <T style={{ color: INK_2 }}>
                  {invoice.status === 'paid' ? 'Payment received' : 'Part payment received'}
                </T>
                <T style={{ fontWeight: 500 }}>−{formatMoney(totals.paid)}</T>
              </View>
            ) : null}
            <View
              style={{
                marginTop: 8,
                backgroundColor: brand,
                borderRadius: 8,
                paddingVertical: 11,
                paddingHorizontal: 13,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <T style={{ color: onBrand, fontWeight: 700, fontSize: 9 }}>Balance due</T>
              <T style={{ color: onBrand, fontWeight: 800, fontSize: 14, letterSpacing: -0.2 }}>
                {formatMoney(totals.balance)}
              </T>
            </View>
            <T style={{ fontSize: 6.75, color: MUTED, textAlign: 'right', marginTop: 5 }}>All amounts in GBP</T>
          </View>
        </View>

        {profile.terms ? (
          <View wrap={false} style={{ marginTop: 28 }}>
            <T style={s.label}>Terms</T>
            <T style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.5 }}>{profile.terms}</T>
          </View>
        ) : null}

        </View>
      </Page>
    </Document>
  );
}
