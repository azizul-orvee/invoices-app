import { Plus } from 'lucide-react';
import type { Profile } from '../types';
import { Monogram, cx } from './ui';

export function ProfileSwitcher({
  profiles,
  activeId,
  onSelect,
  onAdd,
}: {
  profiles: Profile[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:scroll-px-0 sm:px-0" role="tablist" aria-label="Business profile">
      {profiles.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(p.id)}
            className={cx(
              'group relative flex h-12 shrink-0 cursor-pointer snap-start items-center gap-2.5 rounded-2xl border pr-4 pl-2 text-[14px] font-semibold transition-all duration-300',
              active
                ? 'border-transparent bg-white text-ink shadow-[0_0_0_2px_var(--brand),0_10px_24px_-14px_var(--brand)]'
                : 'border-line bg-white/50 text-ink-2 hover:bg-white hover:text-ink',
            )}
          >
            {p.logo ? (
              <span className="flex h-8 w-14 items-center justify-center overflow-hidden rounded-lg bg-white">
                <img src={p.logo} alt="" className="max-h-7 max-w-14 object-contain" />
              </span>
            ) : (
              <Monogram name={p.companyName || p.label} color={p.brandColor} size={32} />
            )}
            <span className="max-w-[9rem] truncate">{p.label || p.companyName || 'Untitled'}</span>
            <span
              aria-hidden
              className={cx('size-2 rounded-full transition-transform duration-300', active ? 'scale-100' : 'scale-0')}
              style={{ background: p.brandColor }}
            />
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-2xl border border-dashed border-line-strong px-4 text-[14px] font-semibold text-ink-2 transition-colors hover:border-ink-2 hover:text-ink"
      >
        <Plus size={16} /> New profile
      </button>
    </div>
  );
}
