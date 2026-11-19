import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { onColor } from '../lib/color';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  step,
  action,
  children,
  className,
  id,
}: {
  title: string;
  step?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cx('card scroll-mt-40 p-4 sm:p-6', className)}>
      <header className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="flex items-center gap-2.5">
          {step ? (
            <span className="grid size-6 place-items-center rounded-full bg-brand-soft font-mono text-[11px] font-medium text-brand-text">
              {step}
            </span>
          ) : null}
          <h2 className="text-[15px] font-bold tracking-[-0.01em] sm:text-base">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-[transform,background-color,box-shadow,opacity] duration-150 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-[13px]',
        size === 'md' && 'h-11 px-4 text-[14px]',
        size === 'lg' && 'h-12 px-5 text-[15px]',
        variant === 'primary' &&
          'bg-brand text-on-brand shadow-[0_1px_0_rgba(255,255,255,.15)_inset,0_8px_20px_-10px_var(--brand)] hover:brightness-110',
        variant === 'secondary' && 'border border-line bg-white text-ink hover:border-line-strong hover:bg-[#fbfaf8]',
        variant === 'ghost' && 'text-ink-2 hover:bg-black/[0.04] hover:text-ink',
        variant === 'danger' && 'border border-danger/20 bg-white text-danger hover:bg-danger/5',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx('grid gap-1 rounded-[14px] bg-[#efede8] p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-10 cursor-pointer truncate rounded-[10px] px-2 text-[13.5px] font-semibold transition-all duration-200',
              active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08),0_4px_12px_-6px_rgba(0,0,0,.15)]' : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-[#0d0e12]/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          'sheet-panel relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-paper shadow-2xl md:max-h-none md:rounded-none md:rounded-l-[24px]',
          wide ? 'md:w-[640px]' : 'md:w-[520px]',
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-black/15 md:hidden" />
        <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 md:px-7 md:pt-7">
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold tracking-[-0.02em]">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-[13.5px] text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-black/5"
          >
            <X size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-7">{children}</div>
        {footer ? <div className="pb-safe border-t border-line bg-white/80 px-5 pt-3 backdrop-blur md:px-7">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Monogram({ name, color, size = 28, className }: { name: string; color: string; size?: number; className?: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || '?').slice(0, 2)).toUpperCase();
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-lg font-extrabold', className)}
      style={{ width: size, height: size, background: color, color: onColor(color), fontSize: size * 0.38 }}
    >
      {text}
    </span>
  );
}
