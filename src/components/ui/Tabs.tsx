import { useRef, type KeyboardEvent } from 'react';

interface TabsProps<T extends string> {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
  idPrefix?: string;
}

export function Tabs<T extends string>({ items, value, onChange, label, className = '', idPrefix = 'tab' }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = items.length;
    const next = (i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`flex gap-6 border-b border-line ${className}`}>
      {items.map((item, i) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-${item.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`micro -mb-px border-b-2 pb-3 pt-1.5 transition-colors duration-150 ${
              active ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
