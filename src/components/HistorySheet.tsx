import { useMemo, useState, type ReactNode } from 'react';
import { Copy, Download, FileText, PencilLine, Search, Trash2 } from 'lucide-react';
import type { Invoice, Profile } from '../types';
import { calcTotals, formatMoney } from '../lib/money';
import { formatDate } from '../lib/dates';
import { Sheet, cx } from './ui';

const STATUS_STYLE = {
  paid: 'bg-[#e6f5ec] text-ok',
  unpaid: 'bg-[#fff2df] text-warn',
  partial: 'bg-[#e9f0ff] text-[#1d55c9]',
} as const;
const STATUS_LABEL = { paid: 'Paid', unpaid: 'Due', partial: 'Part paid' } as const;

export function HistorySheet({
  open,
  onClose,
  history,
  profiles,
  onOpen,
  onDuplicate,
  onDownload,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  history: Invoice[];
  profiles: Profile[];
  onOpen: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onDownload: (inv: Invoice) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const byId = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...history]
      .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
      .filter((h) => filter === 'all' || h.profileId === filter)
      .filter(
        (h) =>
          !needle ||
          [h.number, h.customer.name, h.customer.email, h.vehicleReg, h.reference].some((v) => v?.toLowerCase().includes(needle)),
      );
  }, [history, q, filter]);

  return (
    <Sheet open={open} onClose={onClose} wide title="Invoice history" subtitle={`${history.length} saved on this device`}>
      <div className="sticky top-0 z-10 -mx-5 space-y-3 bg-paper px-5 pb-3 md:-mx-7 md:px-7">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            className="field pl-10"
            placeholder="Search customer, number or reg"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search invoices"
          />
        </div>
        {profiles.length > 1 ? (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {[{ id: 'all', label: 'All' }, ...profiles.map((p) => ({ id: p.id, label: p.label }))].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cx(
                  'h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                  filter === f.id ? 'bg-ink text-white' : 'bg-white text-ink-2 hover:text-ink',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-muted">
            <FileText size={24} />
          </span>
          <p className="mt-4 font-bold">{history.length ? 'No matches' : 'No invoices yet'}</p>
          <p className="mt-1 max-w-xs text-[13.5px] text-muted">
            {history.length ? 'Try a different search.' : 'Every invoice you download or share is kept here so you can re-send it later.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((h) => {
            const p = byId.get(h.profileId);
            const t = calcTotals(h);
            return (
              <li key={h.id} className="card p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold">{h.customer.name || 'No customer'}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
                      <span className="font-mono">{h.number}</span>
                      <span>·</span>
                      <span>{formatDate(h.issueDate)}</span>
                      {p ? (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ background: p.brandColor }} />
                            {p.label}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-bold tabular-nums">{formatMoney(t.total)}</p>
                    <span className={cx('mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-wide uppercase', STATUS_STYLE[h.status])}>
                      {STATUS_LABEL[h.status]}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  <RowBtn onClick={() => onDownload(h)} disabled={!p}>
                    <Download size={15} /> PDF
                  </RowBtn>
                  <RowBtn onClick={() => onOpen(h)} disabled={!p}>
                    <PencilLine size={15} /> Open
                  </RowBtn>
                  <RowBtn onClick={() => onDuplicate(h)} disabled={!p}>
                    <Copy size={15} /> Duplicate
                  </RowBtn>
                  <div className="flex-1" />
                  <RowBtn
                    danger
                    onClick={() => {
                      if (window.confirm(`Remove ${h.number} from history? This can’t be undone.`)) onDelete(h.id);
                    }}
                  >
                    <Trash2 size={15} />
                    <span className="sr-only">Delete</span>
                  </RowBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

function RowBtn({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'text-muted hover:bg-danger/8 hover:text-danger' : 'text-ink-2 hover:bg-black/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
