import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-mono uppercase whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40';

const variants: Record<ButtonVariant, string> = {
  primary: 'btn-primary bg-accent text-accentInk font-bold text-[0.8rem] tracking-[0.06em]',
  ghost: 'border border-white/35 text-text hover:border-flare text-[0.74rem] tracking-[0.08em]',
  quiet: 'text-muted hover:text-text hover:bg-raised text-[0.72rem] tracking-[0.1em]',
  danger: 'border border-flare/40 text-flare hover:bg-flare/10 text-[0.74rem] tracking-[0.08em]',
};

const sizes = {
  sm: 'h-9 px-3',
  md: 'h-11 px-5',
};

export function Button({ variant = 'quiet', size = 'sm', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
