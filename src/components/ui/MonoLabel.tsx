import type { ElementType, ReactNode } from 'react';

export type LabelTone = 'accent' | 'muted' | 'gold' | 'flare' | 'text';

const tones: Record<LabelTone, string> = {
  accent: 'text-accent',
  muted: 'text-muted',
  gold: 'text-gold',
  flare: 'text-flare',
  text: 'text-text',
};

interface MonoLabelProps {
  children: ReactNode;
  tone?: LabelTone;
  /** Sektionsnivå: prefix `◉ ` i flare. */
  eyebrow?: boolean;
  as?: ElementType;
  className?: string;
  id?: string;
}

export function MonoLabel({ children, tone = 'accent', eyebrow = false, as: Tag = 'span', className = '', id }: MonoLabelProps) {
  return (
    <Tag id={id} className={`micro ${tones[tone]} ${className}`}>
      {eyebrow && (
        <span className="text-flare" aria-hidden="true">
          ◉{' '}
        </span>
      )}
      {children}
    </Tag>
  );
}
