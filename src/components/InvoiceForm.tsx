import { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Minus, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Customer, Invoice, LineItem, PaymentMethod, PaymentStatus, Profile } from '../types';
import { calcTotals, formatMoney, splitGross, toPence } from '../lib/money';
import { addDaysISO, formatDate } from '../lib/dates';
import { newItem } from '../lib/invoice';
import { Button, Field, Section, Segmented, cx } from './ui';
import { NumberInput } from './NumberInput';

export interface FormErrors {
  customer?: string;
  items?: string;
}

interface Props {
  invoice: Invoice;
  profile: Profile;
  history: Invoice[];
  errors: FormErrors;
  onChange: (fn: (inv: Invoice) => Invoice) => void;
  onNumberEdited: () => void;
  onEditProfile: () => void;
}

export function InvoiceForm({ invoice, profile, history, errors, onChange, onNumberEdited, onEditProfile }: Props) {
  const totals = useMemo(() => calcTotals(invoice), [invoice]);
  const [showDetails, setShowDetails] = useState(false);

  const setCustomer = (patch: Partial<Customer>) => onChange((inv) => ({ ...inv, customer: { ...inv.customer, ...patch } }));
  const setItem = (id: string, patch: Partial<LineItem>) =>
    onChange((inv) => ({ ...inv, items: inv.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  const removeItem = (id: string) =>
    onChange((inv) => {
      const items = inv.items.filter((it) => it.id !== id);
      return { ...inv, items: items.length ? items : [newItem()] };
    });
  const addItem = (description = '', price = 0) =>
    onChange((inv) => {
      const last = inv.items[inv.items.length - 1];
      if (description && last && !last.description.trim() && !last.price) {
        return { ...inv, items: inv.items.map((it) => (it.id === last.id ? { ...it, description, price } : it)) };
      }
      return { ...inv, items: [...inv.items, newItem(description, price)] };
    });

  // Past customers for quick re-use.
  const pastCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const h of [...history].sort((a, b) => (a.savedAt ?? 0) - (b.savedAt ?? 0))) {
      if (h.customer.name.trim()) map.set(h.customer.name.trim().toLowerCase(), h.customer);
    }
    return map;
  }, [history]);

  const onCustomerName = (name: string) => {
    const match = pastCustomers.get(name.trim().toLowerCase());
    if (match && !invoice.customer.email && !invoice.customer.address && !invoice.customer.phone) {
      setCustomer({ ...match, name });
    } else {
      setCustomer({ name });
    }
  };

  const hasBank = Boolean(profile.bankAccountNumber || profile.bankSortCode);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Invoice header strip ─────────────────────────────── */}
      <div className="card animate-rise overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="eyebrow">Invoice</p>
            <p className="mt-1 truncate font-mono text-[17px] font-medium tracking-tight sm:text-lg">{invoice.number}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
              <CalendarDays size={14} /> {formatDate(invoice.issueDate)}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}>
            Edit
            <ChevronDown size={16} className={cx('transition-transform duration-200', showDetails && 'rotate-180')} />
          </Button>
        </div>
        {showDetails ? (
          <div className="animate-fade grid gap-3 border-t border-line bg-[#fcfbf9] p-4 sm:grid-cols-2 sm:px-6 sm:py-5">
            <Field label="Invoice number" htmlFor="inv-number" hint="Auto-numbered. Edit only if you need to.">
              <input
                id="inv-number"
                className="field font-mono"
                value={invoice.number}
                onChange={(e) => {
                  onNumberEdited();
                  onChange((inv) => ({ ...inv, number: e.target.value }));
                }}
              />
            </Field>
            <Field label="Date of issue" htmlFor="inv-date">
              <input
                id="inv-date"
                type="date"
                className="field"
                value={invoice.issueDate}
                onChange={(e) =>
                  onChange((inv) => ({
                    ...inv,
                    issueDate: e.target.value,
                    dueDate: addDaysISO(e.target.value, profile.paymentTermsDays || 0),
                  }))
                }
              />
            </Field>
          </div>
        ) : null}
      </div>

      {/* ── Customer ─────────────────────────────────────────── */}
      <Section title="Customer" step="01" id="sec-customer" className="animate-rise [animation-delay:60ms]">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Field label="Customer or company name" htmlFor="c-name" error={errors.customer} className="sm:col-span-2">
            <input
              id="c-name"
              className="field"
              list="past-customers"
              autoComplete="off"
              placeholder="e.g. Ipsom Group"
              aria-invalid={Boolean(errors.customer)}
              value={invoice.customer.name}
              onChange={(e) => onCustomerName(e.target.value)}
            />
            <datalist id="past-customers">
              {[...pastCustomers.values()].map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Email" htmlFor="c-email">
            <input
              id="c-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              className="field"
              placeholder="name@company.co.uk"
              value={invoice.customer.email}
              onChange={(e) => setCustomer({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone" htmlFor="c-phone">
            <input
              id="c-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              className="field"
              placeholder="Optional"
              value={invoice.customer.phone}
              onChange={(e) => setCustomer({ phone: e.target.value })}
            />
          </Field>
          <Field label="Contact name" htmlFor="c-contact">
            <input
              id="c-contact"
              className="field"
              placeholder="Optional"
              value={invoice.customer.contact}
              onChange={(e) => setCustomer({ contact: e.target.value })}
            />
          </Field>
          <Field label="Vehicle reg" htmlFor="c-reg">
            <input
              id="c-reg"
              className="field font-semibold tracking-[0.08em] uppercase placeholder:font-normal placeholder:tracking-normal placeholder:normal-case"
              placeholder="Optional, e.g. AB12 CDE"
              value={invoice.vehicleReg}
              autoCapitalize="characters"
              onChange={(e) => onChange((inv) => ({ ...inv, vehicleReg: e.target.value.toUpperCase() }))}
            />
          </Field>
          <Field label="Address" htmlFor="c-address">
            <textarea
              id="c-address"
              rows={3}
              className="field"
              placeholder="Optional"
              value={invoice.customer.address}
              onChange={(e) => setCustomer({ address: e.target.value })}
            />
          </Field>
          <Field label="PO / reference" htmlFor="c-ref">
            <input
              id="c-ref"
              className="field"
              placeholder="Optional"
              value={invoice.reference}
              onChange={(e) => onChange((inv) => ({ ...inv, reference: e.target.value }))}
            />
          </Field>
        </div>
      </Section>

      {/* ── Items ────────────────────────────────────────────── */}
      <Section
        title="Work & price"
        step="02"
        id="sec-items"
        className="animate-rise [animation-delay:120ms]"
        action={<span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-semibold text-brand-text">Prices include 20% VAT</span>}
      >
        <div className="space-y-3">
          {invoice.items.map((it, idx) => (
            <ItemRow
              key={it.id}
              item={it}
              index={idx}
              canRemove={invoice.items.length > 1 || Boolean(it.description || it.price)}
              onChange={(patch) => setItem(it.id, patch)}
              onRemove={() => removeItem(it.id)}
            />
          ))}
        </div>
        {errors.items ? <p className="mt-2 text-[12.5px] font-medium text-danger">{errors.items}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => addItem()}>
            <Plus size={16} /> Add line
          </Button>
          {profile.quickItems
            .filter((q) => q.description.trim())
            .map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addItem(q.description, q.price)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand-text"
              >
                <Sparkles size={13} />
                {q.description}
                {q.price ? <span className="text-muted">· {formatMoney(toPence(q.price))}</span> : null}
              </button>
            ))}
        </div>

        <dl className="mt-5 space-y-2 rounded-2xl bg-[#f7f6f2] p-4 text-[14px]">
          <div className="flex justify-between text-ink-2">
            <dt>Subtotal (excl. VAT)</dt>
            <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-2">
            <dt>VAT (20%)</dt>
            <dd className="tabular-nums">{formatMoney(totals.vat)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
          </div>
        </dl>
      </Section>

      {/* ── Payment ──────────────────────────────────────────── */}
      <Section title="Payment" step="03" id="sec-payment" className="animate-rise [animation-delay:180ms]">
        <div className="space-y-4">
          <Segmented<PaymentStatus>
            ariaLabel="Payment status"
            value={invoice.status}
            onChange={(status) => onChange((inv) => ({ ...inv, status }))}
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partial', label: 'Part paid' },
            ]}
          />

          {invoice.status !== 'unpaid' ? (
            <Field label={invoice.status === 'paid' ? 'Paid by' : 'Part payment made by'}>
              <Segmented<PaymentMethod>
                ariaLabel="Payment method"
                value={invoice.method}
                onChange={(method) => onChange((inv) => ({ ...inv, method }))}
                options={[
                  { value: 'card', label: 'Card' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank', label: 'Bank' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </Field>
          ) : null}

          {invoice.status !== 'paid' ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {invoice.status === 'partial' ? (
                <Field
                  label="Amount received"
                  htmlFor="amount-paid"
                  hint={`Balance left: ${formatMoney(totals.balance)}`}
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">£</span>
                    <NumberInput
                      id="amount-paid"
                      className="field pl-7 tabular-nums"
                      placeholder="0.00"
                      value={invoice.amountPaid}
                      onValue={(amountPaid) => onChange((inv) => ({ ...inv, amountPaid }))}
                    />
                  </div>
                </Field>
              ) : null}
              <Field label="Payment due" htmlFor="due-date">
                <input
                  id="due-date"
                  type="date"
                  className="field"
                  value={invoice.dueDate}
                  min={invoice.issueDate}
                  onChange={(e) => onChange((inv) => ({ ...inv, dueDate: e.target.value }))}
                />
              </Field>
              {!hasBank ? (
                <p className="rounded-xl bg-[#fff6e8] px-3.5 py-3 text-[13px] leading-snug text-[#7a4a0c] sm:col-span-2">
                  Bank details aren’t set for {profile.label || 'this profile'}, so the invoice won’t say how to pay.{' '}
                  <button type="button" onClick={onEditProfile} className="cursor-pointer font-semibold underline underline-offset-2">
                    Add them
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}

          <Field label="Note to customer" htmlFor="notes">
            <textarea
              id="notes"
              rows={2}
              className="field"
              placeholder="e.g. Thank you for your business."
              value={invoice.notes}
              onChange={(e) => onChange((inv) => ({ ...inv, notes: e.target.value }))}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function ItemRow({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  item: LineItem;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<LineItem>) => void;
  onRemove: () => void;
}) {
  const [showDetail, setShowDetail] = useState(Boolean(item.detail));
  const gross = Math.round((item.qty || 0) * toPence(item.price));
  const { net, vat } = splitGross(gross);

  return (
    <div className="animate-rise rounded-2xl border border-line bg-[#fcfbf9] p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <span className="mt-[13px] w-6 shrink-0 font-mono text-[11px] text-muted">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            aria-label={`Line ${index + 1} description`}
            className="field font-medium"
            placeholder="What was done? e.g. Mobile tyre fitting"
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
          {showDetail ? (
            <input
              aria-label={`Line ${index + 1} details`}
              className="field text-[15px]"
              placeholder="Details, e.g. 2 × 205/55 R16 91V, nearside front & rear"
              value={item.detail}
              autoFocus={!item.detail}
              onChange={(e) => onChange({ detail: e.target.value })}
            />
          ) : null}
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove line ${index + 1}`}
            className="mt-[3px] grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <Trash2 size={17} />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-2 pl-8">
        <div>
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">Qty</span>
          <div className="flex h-[46px] items-center rounded-xl border border-line bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="grid h-full w-9 cursor-pointer place-items-center text-ink-2 hover:text-ink disabled:opacity-30"
              disabled={(item.qty || 0) <= 1}
              onClick={() => onChange({ qty: Math.max(1, (item.qty || 1) - 1) })}
            >
              <Minus size={15} />
            </button>
            <NumberInput
              aria-label="Quantity"
              className="h-full w-9 bg-transparent text-center text-[16px] font-semibold tabular-nums outline-none"
              value={item.qty}
              onValue={(qty) => onChange({ qty })}
            />
            <button
              type="button"
              aria-label="Increase quantity"
              className="grid h-full w-9 cursor-pointer place-items-center text-ink-2 hover:text-ink"
              onClick={() => onChange({ qty: (item.qty || 0) + 1 })}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <div className="min-w-[150px] flex-1">
          <span className="mb-1 block text-[11.5px] font-semibold text-muted">Price each, inc. VAT</span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-medium text-muted">£</span>
            <NumberInput
              aria-label={`Line ${index + 1} price including VAT`}
              className="field pl-7 text-[16px] font-semibold tabular-nums"
              placeholder="0.00"
              value={item.price}
              onValue={(price) => onChange({ price })}
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pl-8 text-[12.5px]">
        <span className="text-muted tabular-nums">
          {gross ? (
            <>
              {formatMoney(net)} + {formatMoney(vat)} VAT
            </>
          ) : (
            'Net and VAT are worked out for you'
          )}
          {!showDetail ? (
            <>
              {' · '}
              <button type="button" onClick={() => setShowDetail(true)} className="cursor-pointer font-semibold text-ink-2 hover:text-ink">
                Add details
              </button>
            </>
          ) : null}
        </span>
        <span className="text-[14px] font-bold text-ink tabular-nums">{formatMoney(gross)}</span>
      </div>
    </div>
  );
}
