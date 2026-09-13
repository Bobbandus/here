import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface PopoverProps {
  /** Elementet (t.ex. knappen som öppnade menyn) menyn ska placeras invid. */
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  width?: number;
  /** Textetikett för menyn (skärmläsare). */
  label: string;
}

/**
 * Litet flytande menykort förankrat vid en knapp — används istället för att skriva
 * direkt i tabellceller. Positioneras under (eller ovanför om det inte får plats)
 * ankarelementet, stängs vid klick utanför eller Esc.
 */
export function Popover({ anchorEl, onClose, children, className = '', width = 280, label }: PopoverProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchorEl) return;
    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const left = Math.min(Math.max(12, r.left), vw - width - 12);
      const estHeight = popRef.current?.offsetHeight ?? 200;
      let top = r.bottom + 6;
      if (top + estHeight > vh - 12) top = Math.max(12, r.top - estHeight - 6);
      setPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorEl, width]);

  useEffect(() => {
    if (!anchorEl) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorEl.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchorEl, onClose]);

  if (!anchorEl) return null;

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label={label}
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, visibility: pos ? 'visible' : 'hidden' }}
      className={`glass-strong z-30 rounded-panel p-4 ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
