import { useId, type ReactNode } from 'react';
import { MonoLabel } from './MonoLabel';

interface FieldProps {
  label: string;
  children: (id: string) => ReactNode;
  className?: string;
  hint?: ReactNode;
}

/** Fältetikett i mikroetikettstil + valfri kontroll (input, select, textarea). */
export function Field({ label, children, className = '', hint }: FieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <MonoLabel tone="muted">{label}</MonoLabel>
        {hint && <span className="font-mono text-[0.68rem] text-muted">{hint}</span>}
      </label>
      {children(id)}
    </div>
  );
}
