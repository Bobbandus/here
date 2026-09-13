import type { ReactNode } from 'react';

export type ChipTone = 'accent' | 'accentOutline' | 'gold' | 'goldOutline' | 'flare' | 'muted';

const tones: Record<ChipTone, string> = {
  accent: 'bg-accent text-accentInk border-accent',
  accentOutline: 'border-accent/60 text-accent',
  gold: 'bg-gold text-accentInk border-gold',
  goldOutline: 'border-gold/60 text-gold',
  flare: 'border-flare/60 text-flare',
  muted: 'border-line text-muted',
};

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
  title?: string;
}

export function Chip({ children, tone = 'muted', className = '', title }: ChipProps) {
  return (
    <span
      title={title}
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-mono text-[0.66rem] font-bold uppercase tracking-[0.1em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
