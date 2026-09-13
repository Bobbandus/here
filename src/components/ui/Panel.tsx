import type { ReactNode } from 'react';
import { MonoLabel } from './MonoLabel';

interface PanelProps {
  title: ReactNode;
  eyebrow?: boolean;
  actions?: ReactNode;
  footnote?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}

export function Panel({ title, eyebrow, actions, footnote, children, className = '', bodyClassName = 'p-5', id }: PanelProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={`card ${className}`}>
      <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-5 py-2.5">
        <MonoLabel as="h2" id={headingId} eyebrow={eyebrow}>
          {title}
        </MonoLabel>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
      {footnote && <p className="border-t border-line px-5 py-3 text-[0.7rem] text-muted">{footnote}</p>}
    </section>
  );
}
