import { useRef, useState, type ReactNode } from 'react';
import { Copy, Download, ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import type { Profile, QuickItem } from '../types';
import { processLogo } from '../lib/image';
import { isHex, onColor } from '../lib/color';
import { Button, Field, Monogram, Sheet, cx } from './ui';
import { NumberInput } from './NumberInput';

const SWATCHES = ['#0C1066', '#1D4ED8', '#0F766E', '#047857', '#B4232A', '#E4572E', '#C2410C', '#A16207', '#7C3AED', '#111318'];

export type ProfilesView = { mode: 'list' } | { mode: 'edit'; profile: Profile; isNew: boolean };

interface Props {
  open: boolean;
  view: ProfilesView;
  profiles: Profile[];
  activeId: string;
  onClose: () => void;
  onView: (v: ProfilesView) => void;
  onSave: (p: Profile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (p: Profile) => void;
  onNew: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function ProfilesSheet(props: Props) {
  const { open, view, onClose } = props;
  if (view.mode === 'edit') {
    return (
      <ProfileEditor
        key={view.profile.id}
        open={open}
        initial={view.profile}
        isNew={view.isNew}
        canDelete={props.profiles.length > 1 && !view.isNew}
        onCancel={() => (view.isNew ? onClose() : props.onView({ mode: 'list' }))}
        onClose={onClose}
        onSave={props.onSave}
        onDelete={() => props.onDelete(view.profile.id)}
      />
    );
  }
  return <ProfileList {...props} />;
}

function ProfileList({ open, profiles, activeId, onClose, onView, onDuplicate, onDelete, onNew, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Sheet open={open} onClose={onClose} title="Business profiles" subtitle="Each profile is a business you invoice as.">
      <div className="space-y-3">
        {profiles.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-3.5 sm:p-4">
            <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
              {p.logo ? (
                <img src={p.logo} alt="" className="max-h-9 max-w-16 object-contain" />
              ) : (
                <Monogram name={p.companyName || p.label} color={p.brandColor} size={32} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[15px] font-bold">
                {p.companyName || p.label || 'Untitled'}
                {p.id === activeId ? (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-brand-text uppercase">
                    In use
                  </span>
                ) : null}
              </p>
              <p className="truncate text-[13px] text-muted">
                {[p.label, p.phone || p.mobile, p.email].filter(Boolean).join(' · ') || 'No contact details yet'}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <IconBtn label={`Edit ${p.label}`} onClick={() => onView({ mode: 'edit', profile: p, isNew: false })}>
                <Pencil size={17} />
              </IconBtn>
              <IconBtn label={`Duplicate ${p.label}`} onClick={() => onDuplicate(p)}>
                <Copy size={17} />
              </IconBtn>
              {profiles.length > 1 ? (
                <IconBtn
                  label={`Delete ${p.label}`}
                  danger
                  onClick={() => {
                    if (window.confirm(`Delete the “${p.label || p.companyName}” profile? Saved invoices stay in history.`)) onDelete(p.id);
                  }}
                >
                  <Trash2 size={17} />
                </IconBtn>
              ) : null}
            </div>
          </div>
        ))}
        <Button className="w-full" onClick={onNew}>
          <Plus size={17} /> New profile
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white/60 p-4">
        <p className="text-[14px] font-bold">Backup & move devices</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Profiles and invoice history are saved in this browser only. Export a backup file, then import it on your phone or another
          computer.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onExport}>
            <Download size={15} /> Export backup
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </Sheet>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        'grid size-10 cursor-pointer place-items-center rounded-xl text-ink-2 transition-colors',
        danger ? 'hover:bg-danger/8 hover:text-danger' : 'hover:bg-black/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function ProfileEditor({
  open,
  initial,
  isNew,
  canDelete,
  onCancel,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: Profile;
  isNew: boolean;
  canDelete: boolean;
  onCancel: () => void;
  onClose: () => void;
  onSave: (p: Profile) => void;
  onDelete: () => void;
}) {
  const [p, setP] = useState<Profile>(initial);
  const [error, setError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [hex, setHex] = useState(initial.brandColor);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Profile>) => setP((cur) => ({ ...cur, ...patch }));
  const setColor = (c: string) => {
    set({ brandColor: c });
    setHex(c);
  };

  const onLogo = async (file: File) => {
    setLogoBusy(true);
    try {
      const { dataUrl, suggestedColor } = await processLogo(file);
      set({ logo: dataUrl });
      if (suggestedColor) setColor(suggestedColor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image.');
    } finally {
      setLogoBusy(false);
    }
  };

  const save = () => {
    if (!p.companyName.trim()) {
      setError('Add the company name — it appears on every invoice.');
      document.getElementById('p-company')?.focus();
      return;
    }
    onSave({
      ...p,
      label: p.label.trim() || p.companyName.trim().split(/\s+/)[0],
      invoicePrefix: (p.invoicePrefix || 'INV').trim().toUpperCase(),
      quickItems: p.quickItems.filter((q) => q.description.trim()),
      updatedAt: Date.now(),
    });
  };

  const setQuick = (i: number, patch: Partial<QuickItem>) =>
    set({ quickItems: p.quickItems.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      title={isNew ? 'New profile' : `Edit ${initial.label || 'profile'}`}
      subtitle="Everything here prints on every invoice for this business."
      footer={
        <div className="flex items-center gap-2">
          {canDelete ? (
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger/5 hover:text-danger"
              onClick={() => {
                if (window.confirm(`Delete the “${initial.label}” profile? Saved invoices stay in history.`)) onDelete();
              }}
            >
              <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={save} style={{ ['--brand' as string]: p.brandColor, ['--on-brand' as string]: onColor(p.brandColor) }}>
            Save profile
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <p className="flex items-start justify-between gap-3 rounded-xl bg-danger/8 px-3.5 py-3 text-[13.5px] font-medium text-danger">
            {error}
            <button type="button" aria-label="Dismiss" onClick={() => setError(null)} className="cursor-pointer">
              <X size={16} />
            </button>
          </p>
        ) : null}

        <Group title="Brand">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Logo</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-white transition-colors hover:border-ink-2 sm:w-48"
              >
                {p.logo ? (
                  <img src={p.logo} alt="Logo" className="max-h-20 max-w-[85%] object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-[13px] font-medium text-muted">
                    <ImagePlus size={22} />
                    {logoBusy ? 'Reading…' : 'Upload logo'}
                  </span>
                )}
                {p.logo ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-[11.5px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Replace
                  </span>
                ) : null}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onLogo(f);
                  e.target.value = '';
                }}
              />
              {p.logo ? (
                <button
                  type="button"
                  onClick={() => set({ logo: '' })}
                  className="mt-1.5 cursor-pointer text-[12.5px] font-semibold text-muted hover:text-danger"
                >
                  Remove logo
                </button>
              ) : (
                <p className="mt-1.5 text-[12px] text-muted">PNG with transparent background looks best.</p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Brand colour</span>
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use ${c}`}
                    onClick={() => setColor(c)}
                    className={cx(
                      'size-9 cursor-pointer rounded-full transition-transform hover:scale-110',
                      p.brandColor.toLowerCase() === c.toLowerCase() && 'ring-2 ring-ink ring-offset-2 ring-offset-paper',
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line" style={{ background: p.brandColor }}>
                  <input
                    type="color"
                    aria-label="Custom brand colour"
                    value={isHex(p.brandColor) && p.brandColor.length === 7 ? p.brandColor : '#111318'}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <input
                  aria-label="Brand colour hex"
                  className="field max-w-[140px] font-mono uppercase"
                  value={hex}
                  onChange={(e) => {
                    const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                    setHex(v);
                    if (isHex(v)) set({ brandColor: v });
                  }}
                />
              </div>
              <p className="mt-1.5 text-[12px] text-muted">Used for the top bar, amount and balance box on the PDF.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Company name" htmlFor="p-company">
              <input
                id="p-company"
                className="field"
                placeholder="e.g. Emergency Tyre Rescue"
                value={p.companyName}
                onChange={(e) => set({ companyName: e.target.value })}
              />
            </Field>
            <Field label="Short name" htmlFor="p-label" hint="Shown on the profile switcher.">
              <input id="p-label" className="field" placeholder="e.g. ETR" value={p.label} onChange={(e) => set({ label: e.target.value })} />
            </Field>
            <Field label="Tagline" htmlFor="p-tagline" hint="Only shows when there’s no logo." className="sm:col-span-2">
              <input
                id="p-tagline"
                className="field"
                placeholder="e.g. 24/7 Mobile Tyre Fitting"
                value={p.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
              />
            </Field>
          </div>
        </Group>

        <Group title="Contact">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Address" htmlFor="p-address" className="sm:row-span-2">
              <textarea
                id="p-address"
                rows={4}
                className="field"
                placeholder={'Street\nTown\nPostcode'}
                value={p.address}
                onChange={(e) => set({ address: e.target.value })}
              />
            </Field>
            <Field label="Phone" htmlFor="p-phone">
              <input id="p-phone" type="tel" className="field" value={p.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Mobile" htmlFor="p-mobile">
              <input id="p-mobile" type="tel" className="field" value={p.mobile} onChange={(e) => set({ mobile: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="p-email">
              <input id="p-email" type="email" className="field" value={p.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Website" htmlFor="p-web">
              <input id="p-web" className="field" placeholder="www.example.co.uk" value={p.website} onChange={(e) => set({ website: e.target.value })} />
            </Field>
          </div>
        </Group>

        <Group title="Company & VAT">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="VAT number" htmlFor="p-vat">
              <input id="p-vat" className="field" value={p.vatNumber} onChange={(e) => set({ vatNumber: e.target.value })} />
            </Field>
            <Field label="Company number" htmlFor="p-co" hint="Optional — Companies House number.">
              <input id="p-co" className="field" value={p.companyNumber} onChange={(e) => set({ companyNumber: e.target.value })} />
            </Field>
          </div>
        </Group>

        <Group title="Invoicing">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Field label="Invoice number prefix" htmlFor="p-prefix" hint={`e.g. ${(p.invoicePrefix || 'INV').toUpperCase()}-2026-1118-01`}>
              <input
                id="p-prefix"
                className="field font-mono uppercase"
                maxLength={8}
                value={p.invoicePrefix}
                onChange={(e) => set({ invoicePrefix: e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase() })}
              />
            </Field>
            <Field label="Payment terms" htmlFor="p-terms-days" hint="Sets the due date on unpaid invoices.">
              <select
                id="p-terms-days"
                className="field appearance-none"
                value={p.paymentTermsDays}
                onChange={(e) => set({ paymentTermsDays: Number(e.target.value) })}
              >
                <option value={0}>Due on receipt</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </Field>
            <Field label="Default note to customer" htmlFor="p-note" className="sm:col-span-2">
              <input id="p-note" className="field" value={p.defaultNote} onChange={(e) => set({ defaultNote: e.target.value })} />
            </Field>
            <Field label="Terms / small print" htmlFor="p-smallprint" hint="Optional — e.g. warranty or returns policy." className="sm:col-span-2">
              <textarea id="p-smallprint" rows={3} className="field" value={p.terms} onChange={(e) => set({ terms: e.target.value })} />
            </Field>
          </div>
        </Group>

        <Group title="Bank details" subtitle="Printed on unpaid and part-paid invoices.">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <Field label="Account name" htmlFor="p-bank-name" className="sm:col-span-3">
              <input id="p-bank-name" className="field" value={p.bankAccountName} onChange={(e) => set({ bankAccountName: e.target.value })} />
            </Field>
            <Field label="Sort code" htmlFor="p-sort">
              <input
                id="p-sort"
                inputMode="numeric"
                className="field font-mono"
                placeholder="00-00-00"
                value={p.bankSortCode}
                onChange={(e) => set({ bankSortCode: e.target.value })}
              />
            </Field>
            <Field label="Account number" htmlFor="p-acc" className="sm:col-span-2">
              <input
                id="p-acc"
                inputMode="numeric"
                className="field font-mono"
                placeholder="12345678"
                value={p.bankAccountNumber}
                onChange={(e) => set({ bankAccountNumber: e.target.value })}
              />
            </Field>
          </div>
        </Group>

        <Group title="Quick items" subtitle="One-tap buttons for jobs you invoice often. Leave the price blank to type it each time.">
          <div className="space-y-2">
            {p.quickItems.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label="Quick item description"
                  className="field flex-1"
                  placeholder="e.g. Emergency call-out"
                  value={q.description}
                  onChange={(e) => setQuick(i, { description: e.target.value })}
                />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">£</span>
                  <NumberInput
                    aria-label="Quick item price including VAT"
                    className="field pl-6 tabular-nums"
                    placeholder="inc VAT"
                    value={q.price}
                    onValue={(price) => setQuick(i, { price })}
                  />
                </div>
                <IconBtn label="Remove quick item" danger onClick={() => set({ quickItems: p.quickItems.filter((_, idx) => idx !== i) })}>
                  <Trash2 size={16} />
                </IconBtn>
              </div>
            ))}
            <Button size="sm" onClick={() => set({ quickItems: [...p.quickItems, { description: '', price: 0 }] })}>
              <Plus size={15} /> Add quick item
            </Button>
          </div>
        </Group>
      </div>
    </Sheet>
  );
}

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <fieldset className="card space-y-4 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="text-[15px] font-bold tracking-[-0.01em]">{title}</p>
        {subtitle ? <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}
