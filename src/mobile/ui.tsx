import { useEffect, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../components/ui/Icon';

export function MHeader({
  title,
  sub,
  onBack,
  right,
}: {
  title: ReactNode;
  sub?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-ink px-3">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Tillbaka" className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text active:bg-raised">
          <Icon name="chevronLeft" size={20} />
        </button>
      )}
      <div className={`min-w-0 flex-1 ${onBack ? '' : 'pl-1'}`}>
        <div className="truncate font-display text-[17px] font-bold leading-tight">{title}</div>
        {sub && <div className="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{sub}</div>}
      </div>
      {right}
    </header>
  );
}

export function IconButton({ icon, label, onClick, active }: { icon: IconName; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-raised ${active ? 'text-accent' : 'text-text'}`}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Stäng" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[85dvh] flex-col rounded-t-[20px] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
          <h2 className="font-display text-[17px] font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="h-10 rounded-full px-3 font-mono text-[13px] font-bold uppercase text-accent active:bg-raised">
            Klar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[12px] bg-ink p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 flex-1 rounded-[9px] font-mono text-[13px] font-bold uppercase tracking-[0.04em] transition-colors ${
            value === o.value ? 'bg-raised text-accent' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{children}</div>;
}

/** 16px är minimum — mindre text i ett fält får iOS Safari att zooma in vid fokus. */
export const inputClass =
  'h-12 w-full rounded-[12px] border border-line bg-ink px-4 text-[16px] text-text outline-none placeholder:text-muted focus:border-accent';

/**
 * Höjd på det synliga området när iOS-tangentbordet är uppe. `100dvh` krymper inte
 * för tangentbordet i Safari, så en helskärmseditor skulle annars hamna delvis bakom det.
 */
export function useVisualViewport(): { height: number; top: number } {
  const read = () => ({
    height: window.visualViewport?.height ?? window.innerHeight,
    top: window.visualViewport?.offsetTop ?? 0,
  });
  const [vv, setVv] = useState(read);
  useEffect(() => {
    const v = window.visualViewport;
    const update = () => setVv(read());
    v?.addEventListener('resize', update);
    v?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      v?.removeEventListener('resize', update);
      v?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return vv;
}
