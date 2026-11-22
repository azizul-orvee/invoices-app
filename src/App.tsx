import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Building2, Check, Download, Eye, History, Loader2, Plus, ReceiptText, Share2 } from 'lucide-react';
import type { Invoice, Profile } from './types';
import { InvoiceForm, type FormErrors } from './components/InvoiceForm';
import { ProfileSwitcher } from './components/ProfileSwitcher';
import { ProfilesSheet, type ProfilesView } from './components/ProfilesSheet';
import { HistorySheet } from './components/HistorySheet';
import { PdfPreview } from './components/PdfPreview';
import { Button, Sheet, cx } from './components/ui';
import {
  loadActiveProfileId,
  loadDraft,
  loadHistory,
  loadProfiles,
  makeBackup,
  parseBackup,
  saveActiveProfileId,
  saveDraft,
  saveHistory,
  saveProfiles,
  uid,
} from './lib/storage';
import { fileNameFor, newInvoice, nextInvoiceNumber } from './lib/invoice';
import { calcTotals, formatMoney } from './lib/money';
import { addDaysISO, todayISO } from './lib/dates';
import { mix, onColor, readableOnWhite } from './lib/color';
import { blankProfile } from './seed';

const loadGenerator = () => import('./pdf/generate');

function bootstrap() {
  const profiles = loadProfiles();
  const history = loadHistory();
  const draft = loadDraft();
  const draftProfile = draft && profiles.find((p) => p.id === draft.profileId);
  const isEmpty = (d: Invoice) => !d.customer.name.trim() && !d.items.some((i) => i.description.trim() || i.price);

  if (draft && draftProfile && !(isEmpty(draft) && draft.issueDate !== todayISO())) {
    return { profiles, history, activeId: draftProfile.id, invoice: draft };
  }
  const stored = loadActiveProfileId();
  const active = profiles.find((p) => p.id === stored) ?? profiles[0];
  return { profiles, history, activeId: active.id, invoice: newInvoice(active, history) };
}

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const canShareFiles = (() => {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] })
    );
  } catch {
    return false;
  }
})();

interface Toast {
  id: number;
  message: string;
  tone?: 'ok' | 'error';
  action?: { label: string; run: () => void };
}

export default function App() {
  const [boot] = useState(bootstrap);
  const [profiles, setProfiles] = useState<Profile[]>(boot.profiles);
  const [history, setHistory] = useState<Invoice[]>(boot.history);
  const [activeId, setActiveId] = useState(boot.activeId);
  const [invoice, setInvoice] = useState<Invoice>(boot.invoice);
  const [errors, setErrors] = useState<FormErrors>({});
  const autoNumber = useRef(!boot.history.some((h) => h.id === boot.invoice.id));

  const [profilesOpen, setProfilesOpen] = useState(false);
  const [profilesView, setProfilesView] = useState<ProfilesView>({ mode: 'list' });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [working, setWorking] = useState<null | 'download' | 'share'>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const isDesktop = useMedia('(min-width: 1024px)');
  const profile = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const totals = useMemo(() => calcTotals(invoice), [invoice]);
  const fileName = fileNameFor(profile, invoice);
  const isSaved = history.some((h) => h.id === invoice.id);

  const notify = useCallback((t: Omit<Toast, 'id'>) => setToast({ ...t, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.action ? 7000 : 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Warm up the PDF engine once the page is idle, so the first Download is instant on phones too.
  useEffect(() => {
    const warm = () => void loadGenerator();
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(t);
  }, []);

  // ── Persist ──────────────────────────────────────────────
  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(invoice), 250);
    return () => window.clearTimeout(t);
  }, [invoice]);
  useEffect(() => void saveActiveProfileId(activeId), [activeId]);

  // ── Clear validation messages as soon as they're fixed ──
  useEffect(() => {
    setErrors((e) => {
      if (!e.customer && !e.items) return e;
      return {
        customer: invoice.customer.name.trim() ? undefined : e.customer,
        items: invoice.items.some((i) => i.description.trim() && i.price > 0) ? undefined : e.items,
      };
    });
  }, [invoice]);

  // ── Live PDF render (desktop always; phone only while preview is open) ──
  const [pdf, setPdf] = useState<{ blob: Blob; invoice: Invoice; profile: Profile } | null>(null);
  const [rendering, setRendering] = useState(false);
  const renderSeq = useRef(0);
  const firstRender = useRef(true);
  const wantsPreview = isDesktop || previewOpen;

  useEffect(() => {
    if (!wantsPreview) return;
    if (pdf && pdf.invoice === invoice && pdf.profile === profile) return;
    setRendering(true);
    const delay = firstRender.current ? 0 : 420;
    firstRender.current = false;
    const t = window.setTimeout(async () => {
      const my = ++renderSeq.current;
      try {
        const { renderInvoicePdf } = await loadGenerator();
        const blob = await renderInvoicePdf(profile, invoice);
        if (my === renderSeq.current) setPdf({ blob, invoice, profile });
      } catch (e) {
        console.error(e);
      } finally {
        if (my === renderSeq.current) setRendering(false);
      }
    }, delay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, profile, wantsPreview]);

  const getBlob = async (inv: Invoice, prof: Profile) => {
    if (pdf && pdf.invoice === inv && pdf.profile === prof) return pdf.blob;
    const { renderInvoicePdf } = await loadGenerator();
    return renderInvoicePdf(prof, inv);
  };

  // ── Invoice editing ──────────────────────────────────────
  const update = useCallback(
    (fn: (inv: Invoice) => Invoice) =>
      setInvoice((prev) => {
        let next = fn(prev);
        if (autoNumber.current && next.issueDate !== prev.issueDate) {
          next = { ...next, number: nextInvoiceNumber(profile, history.filter((h) => h.id !== next.id), next.issueDate) };
        }
        return next;
      }),
    [profile, history],
  );

  const startNew = useCallback(
    (prof: Profile = profile, hist: Invoice[] = history) => {
      autoNumber.current = true;
      setErrors({});
      setInvoice(newInvoice(prof, hist));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [profile, history],
  );

  /** Moves the open invoice onto another profile. A saved invoice stays put; a fresh one starts instead. */
  const switchInvoiceTo = (next: Profile, prev: Profile) => {
    if (history.some((h) => h.id === invoice.id)) {
      startNew(next, history);
      return;
    }
    setInvoice((inv) => ({
      ...inv,
      profileId: next.id,
      number: autoNumber.current ? nextInvoiceNumber(next, history.filter((h) => h.id !== inv.id), inv.issueDate) : inv.number,
      dueDate: addDaysISO(inv.issueDate, next.paymentTermsDays || 0),
      notes: !inv.notes.trim() || inv.notes === prev.defaultNote ? next.defaultNote : inv.notes,
    }));
  };

  const selectProfile = (id: string) => {
    const next = profiles.find((p) => p.id === id);
    if (!next || id === activeId) return;
    setActiveId(id);
    switchInvoiceTo(next, profile);
  };

  const validate = () => {
    const e: FormErrors = {};
    if (!invoice.customer.name.trim()) e.customer = 'Add who this invoice is for.';
    if (!invoice.items.some((i) => i.description.trim() && i.price > 0)) e.items = 'Add at least one line with a description and a price.';
    setErrors(e);
    const first = e.customer ? 'c-name' : e.items ? 'sec-items' : null;
    if (first) {
      setPreviewOpen(false);
      const el = document.getElementById(first);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement) window.setTimeout(() => el.focus({ preventScroll: true }), 350);
      return false;
    }
    return true;
  };

  const record = (inv: Invoice) => {
    const saved = { ...inv, savedAt: Date.now() };
    const next = [saved, ...history.filter((h) => h.id !== inv.id)];
    setHistory(next);
    saveHistory(next);
    autoNumber.current = false;
    return next;
  };

  const afterExport = (verb: string, hist: Invoice[]) =>
    notify({ message: `${invoice.number} ${verb} and saved to history`, tone: 'ok', action: { label: 'New invoice', run: () => startNew(profile, hist) } });

  const download = async () => {
    if (working || !validate()) return;
    setWorking('download');
    try {
      const blob = await getBlob(invoice, profile);
      saveFile(blob, fileName);
      afterExport('downloaded', record(invoice));
    } catch (e) {
      console.error(e);
      notify({ message: 'Could not create the PDF. Please try again.', tone: 'error' });
    } finally {
      setWorking(null);
    }
  };

  /**
   * Opens the share sheet with the PDF file itself (WhatsApp, email, Save to Files…).
   * If making the PDF took long enough that the browser no longer counts it as a tap, it offers a
   * one-tap retry instead of falling back to a download: on iPhones a download opens the PDF at a
   * temporary blob: address, and people copy that address and send a link nobody else can open.
   */
  const sharePdf = async (
    blob: Blob,
    name: string,
    title: string,
    onDone?: (verb: 'shared' | 'downloaded') => void,
    retry = true,
  ): Promise<void> => {
    const file = new File([blob], name, { type: 'application/pdf' });
    try {
      await navigator.share({ files: [file], title });
      onDone?.('shared');
    } catch (err) {
      const reason = err instanceof DOMException ? err.name : '';
      if (reason === 'AbortError') return; // closed the share sheet
      if (reason === 'NotAllowedError' && retry) {
        notify({ message: 'Your PDF is ready.', action: { label: 'Share', run: () => void sharePdf(blob, name, title, onDone, false) } });
        return;
      }
      saveFile(blob, name);
      onDone?.('downloaded');
    }
  };

  const share = async () => {
    if (working || !validate()) return;
    setWorking('share');
    try {
      const blob = await getBlob(invoice, profile);
      await sharePdf(blob, fileName, `Invoice ${invoice.number}`, (verb) => afterExport(verb, record(invoice)));
    } catch (e) {
      console.error(e);
      notify({ message: 'Could not create the PDF. Please try again.', tone: 'error' });
    } finally {
      setWorking(null);
    }
  };

  // ── Profiles ─────────────────────────────────────────────
  const persistProfiles = (next: Profile[]) => {
    setProfiles(next);
    if (!saveProfiles(next)) notify({ message: 'Browser storage is full — try a smaller logo image.', tone: 'error' });
  };

  const openProfiles = (view: ProfilesView = { mode: 'list' }) => {
    setProfilesView(view);
    setProfilesOpen(true);
  };

  const onSaveProfile = (p: Profile) => {
    const exists = profiles.some((x) => x.id === p.id);
    persistProfiles(exists ? profiles.map((x) => (x.id === p.id ? p : x)) : [...profiles, p]);
    if (!exists) {
      setProfilesOpen(false);
      setActiveId(p.id);
      switchInvoiceTo(p, profile);
      notify({ message: `${p.label} is ready — you’re now invoicing as ${p.companyName}`, tone: 'ok' });
    } else {
      if (p.id === activeId && autoNumber.current) {
        setInvoice((inv) => ({ ...inv, number: nextInvoiceNumber(p, history.filter((h) => h.id !== inv.id), inv.issueDate) }));
      }
      setProfilesView({ mode: 'list' });
      notify({ message: `${p.label} saved`, tone: 'ok' });
    }
  };

  const onDeleteProfile = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    if (!next.length) return;
    persistProfiles(next);
    setProfilesView({ mode: 'list' });
    if (id === activeId) {
      setActiveId(next[0].id);
      startNew(next[0], history);
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(makeBackup(profiles, history), null, 2)], { type: 'application/json' });
    saveFile(blob, `invoice-studio-backup-${todayISO()}.json`);
  };

  const importBackup = async (file: File) => {
    try {
      const data = parseBackup(await file.text());
      const pMap = new Map(profiles.map((p) => [p.id, p]));
      data.profiles.forEach((p) => pMap.set(p.id, p));
      const hMap = new Map(history.map((h) => [h.id, h]));
      data.history.forEach((h) => hMap.set(h.id, h));
      const nextHistory = [...hMap.values()];
      persistProfiles([...pMap.values()]);
      setHistory(nextHistory);
      saveHistory(nextHistory);
      notify({ message: `Imported ${data.profiles.length} profile(s) and ${data.history.length} invoice(s)`, tone: 'ok' });
    } catch (e) {
      notify({ message: e instanceof Error ? e.message : 'Import failed', tone: 'error' });
    }
  };

  // ── History ──────────────────────────────────────────────
  const openFromHistory = (h: Invoice) => {
    setActiveId(h.profileId);
    autoNumber.current = false;
    setErrors({});
    setInvoice({ ...h });
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicateFromHistory = (h: Invoice) => {
    const prof = profiles.find((p) => p.id === h.profileId);
    if (!prof) return;
    const issueDate = todayISO();
    setActiveId(prof.id);
    autoNumber.current = true;
    setErrors({});
    setInvoice({
      ...h,
      id: uid(),
      savedAt: undefined,
      issueDate,
      dueDate: addDaysISO(issueDate, prof.paymentTermsDays || 0),
      number: nextInvoiceNumber(prof, history, issueDate),
      items: h.items.map((i) => ({ ...i, id: uid() })),
    });
    setHistoryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadFromHistory = async (h: Invoice) => {
    const prof = profiles.find((p) => p.id === h.profileId);
    if (!prof) return;
    const { renderInvoicePdf } = await loadGenerator();
    saveFile(await renderInvoicePdf(prof, h), fileNameFor(prof, h));
  };

  const shareFromHistory = async (h: Invoice) => {
    const prof = profiles.find((p) => p.id === h.profileId);
    if (!prof) return;
    try {
      const { renderInvoicePdf } = await loadGenerator();
      await sharePdf(await renderInvoicePdf(prof, h), fileNameFor(prof, h), `Invoice ${h.number}`);
    } catch (e) {
      console.error(e);
      notify({ message: 'Could not create the PDF. Please try again.', tone: 'error' });
    }
  };

  const deleteFromHistory = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  // ── Theme ────────────────────────────────────────────────
  const brand = profile.brandColor;
  const themeVars = {
    '--brand': brand,
    '--on-brand': onColor(brand),
    '--brand-soft': mix(brand, 0.09),
    '--brand-text': readableOnWhite(brand),
  } as CSSProperties;

  // Phones lead with Share: it sends the PDF file itself. A phone download opens the PDF at a temporary
  // blob: address that only works on that device, and people send that address on as a "link".
  const shareFirst = canShareFiles && !isDesktop;

  const actionButtons = (size: 'md' | 'lg', stretch = false) => {
    const width = (primary: boolean) => cx(primary ? (stretch ? 'flex-[1.4]' : 'flex-1') : stretch && 'flex-1');
    const shareBtn = (primary: boolean) => (
      <Button size={size} variant={primary ? 'primary' : 'secondary'} onClick={share} disabled={Boolean(working)} className={width(primary)}>
        {working === 'share' ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
        Share
      </Button>
    );
    const downloadBtn = (primary: boolean) => (
      <Button size={size} variant={primary ? 'primary' : 'secondary'} onClick={download} disabled={Boolean(working)} className={width(primary)}>
        {working === 'download' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {primary ? 'Download PDF' : 'Download'}
      </Button>
    );
    return shareFirst ? (
      <>
        {downloadBtn(false)}
        {shareBtn(true)}
      </>
    ) : (
      <>
        {canShareFiles ? shareBtn(false) : null}
        {downloadBtn(true)}
      </>
    );
  };

  return (
    <div className="brand-scope min-h-dvh" style={themeVars}>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <ReceiptText size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-[15px] font-extrabold tracking-[-0.02em]">Invoice Studio</p>
              <p className="truncate text-[12px] text-muted">{profile.companyName}</p>
            </div>
          </div>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)} aria-label="Invoice history">
            <History size={18} />
            <span className="hidden sm:inline">History</span>
            {history.length ? (
              <span className="rounded-full bg-black/[0.06] px-1.5 text-[11px] font-bold tabular-nums">{history.length}</span>
            ) : null}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openProfiles()} aria-label="Business profiles">
            <Building2 size={18} />
            <span className="hidden sm:inline">Profiles</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-36 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        {/* ── Title + profile switcher ── */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="eyebrow">{isSaved ? 'Editing saved invoice' : 'New invoice'}</p>
            <h1 className="mt-1.5 text-[28px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[36px]">
              Who’s invoicing<span className="text-brand-text">?</span>
            </h1>
          </div>
          <Button size="sm" onClick={() => startNew()}>
            <Plus size={16} />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">Start fresh</span>
          </Button>
        </div>
        <ProfileSwitcher
          profiles={profiles}
          activeId={activeId}
          onSelect={selectProfile}
          onAdd={() => openProfiles({ mode: 'edit', profile: blankProfile(uid()), isNew: true })}
        />

        <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.92fr)] xl:gap-10">
          <InvoiceForm
            invoice={invoice}
            profile={profile}
            history={history}
            errors={errors}
            onChange={update}
            onNumberEdited={() => (autoNumber.current = false)}
            onEditProfile={() => openProfiles({ mode: 'edit', profile, isNew: false })}
          />

          {/* ── Desktop live preview ── */}
          {isDesktop ? (
            <aside className="animate-rise [animation-delay:120ms]">
              <div className="sticky top-24">
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold">Live preview</p>
                      <p className="truncate text-[12px] text-muted">{fileName}</p>
                    </div>
                    <span
                      className={cx(
                        'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap transition-colors',
                        rendering ? 'bg-black/[0.04] text-muted' : 'bg-[#e6f5ec] text-ok',
                      )}
                    >
                      {rendering ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
                      {rendering ? 'Updating' : 'Up to date'}
                    </span>
                  </div>
                  <div className="max-h-[calc(100dvh-236px)] overflow-y-auto bg-[#e8e6e0] p-6">
                    <PdfPreview blob={pdf?.blob ?? null} busy={rendering} />
                  </div>
                  <div className="flex gap-2 border-t border-line p-4">{actionButtons('lg')}</div>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </main>

      {/* ── Phone action bar ── */}
      {!isDesktop ? (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center gap-2 px-4 pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-muted">
                {invoice.status === 'paid' ? 'Total paid' : 'Balance due'} · inc. VAT
              </p>
              <p className="truncate text-[20px] leading-tight font-extrabold tracking-[-0.02em] tabular-nums">
                {formatMoney(invoice.status === 'paid' ? totals.total : totals.balance)}
              </p>
            </div>
            {/* Tighter padding, and an icon-only Preview on the narrowest phones, keep the total on one line. */}
            <Button size="lg" onClick={() => setPreviewOpen(true)} aria-label="Preview PDF" className="px-4!">
              <Eye size={18} />
              <span className="max-[380px]:hidden">Preview</span>
            </Button>
            {canShareFiles ? (
              <Button size="lg" variant="primary" onClick={share} disabled={Boolean(working)} className="px-4!">
                {working === 'share' ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                Share
              </Button>
            ) : (
              <Button size="lg" variant="primary" onClick={download} disabled={Boolean(working)}>
                {working === 'download' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                PDF
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Phone preview ── */}
      <Sheet
        open={previewOpen && !isDesktop}
        onClose={() => setPreviewOpen(false)}
        title="Preview"
        subtitle={fileName}
        footer={<div className="flex gap-2">{actionButtons('lg', true)}</div>}
      >
        <div className="rounded-2xl bg-[#e8e6e0] p-3">
          <PdfPreview blob={pdf?.blob ?? null} busy={rendering} />
        </div>
      </Sheet>

      <ProfilesSheet
        open={profilesOpen}
        view={profilesView}
        profiles={profiles}
        activeId={activeId}
        onClose={() => setProfilesOpen(false)}
        onView={setProfilesView}
        onSave={onSaveProfile}
        onDelete={onDeleteProfile}
        onDuplicate={(p) =>
          setProfilesView({
            mode: 'edit',
            isNew: true,
            profile: { ...p, id: uid(), label: `${p.label} copy`, updatedAt: Date.now() },
          })
        }
        onNew={() => setProfilesView({ mode: 'edit', profile: blankProfile(uid()), isNew: true })}
        onExport={exportBackup}
        onImport={importBackup}
      />

      <HistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        profiles={profiles}
        onOpen={openFromHistory}
        onDuplicate={duplicateFromHistory}
        onDownload={downloadFromHistory}
        onShare={shareFirst ? shareFromHistory : undefined}
        onDelete={deleteFromHistory}
      />

      {/* ── Toast ── */}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4 lg:bottom-8">
          <div
            key={toast.id}
            role="status"
            className={cx(
              'animate-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-4 text-[13.5px] font-medium text-white shadow-2xl',
              toast.tone === 'error' ? 'bg-danger' : 'bg-ink',
            )}
          >
            {toast.tone === 'ok' ? (
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#34c26b] text-ink">
                <Check size={12} strokeWidth={3.5} />
              </span>
            ) : null}
            <span className="min-w-0">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action!.run();
                  setToast(null);
                }}
                className="shrink-0 cursor-pointer rounded-xl bg-white/12 px-3 py-1.5 font-semibold hover:bg-white/20"
              >
                {toast.action.label}
              </button>
            ) : (
              <span className="w-1.5" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
