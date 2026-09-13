import { useEffect, useRef } from 'react';
import { useApp } from '../../state/AppState';
import type { HeadingStyle, Theme } from '../../types';
import { headingSeparator } from '../../fountain/parse';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';

const THEMES: { id: Theme; label: string; detail: string; icon: 'moon' | 'sun' }[] = [
  { id: 'dark', label: 'Mörkt', detail: 'Studioläget — täta rutnät, film-korn, grönt/rött.', icon: 'moon' },
  { id: 'light', label: 'Ljust', detail: 'Luftigt och mjukt — vita kort, mjuka skuggor.', icon: 'sun' },
];

const HEADING_STYLES: { id: HeadingStyle; label: string }[] = [
  { id: 'dash', label: 'Bindestreck' },
  { id: 'period', label: 'Punkt' },
];

export function SettingsDialog() {
  const { state } = useApp();
  if (!state.settingsOpen) return null;
  return <Dialog />;
}

function Dialog() {
  const { state, dispatch } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => dispatch({ type: 'SET_SETTINGS_OPEN', open: false });

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 pt-[12vh]" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="glass-strong w-[520px] max-w-[calc(100vw-32px)] rounded-panel"
      >
        <header className="flex h-14 items-center justify-between border-b border-white/10 pl-6 pr-3">
          <MonoLabel as="h2" id="settings-title" eyebrow>
            Inställningar
          </MonoLabel>
          <button
            ref={closeRef}
            type="button"
            aria-label="Stäng"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
          >
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-6 p-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="micro mb-1 text-muted">Tema</legend>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer flex-col gap-2 rounded-media border p-4 transition-colors duration-150 ${
                    state.theme === t.id ? 'border-accent bg-accent/[0.06]' : 'border-line hover:border-accent/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="theme"
                      value={t.id}
                      checked={state.theme === t.id}
                      onChange={() => dispatch({ type: 'SET_THEME', theme: t.id })}
                      className="accent-accent"
                    />
                    <Icon name={t.icon} size={14} />
                    <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]">{t.label}</span>
                  </span>
                  <span className="text-[12px] leading-snug text-muted">{t.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="micro mb-1 text-muted">Scenrubriker</legend>
            <div className="grid grid-cols-2 gap-3">
              {HEADING_STYLES.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer flex-col gap-2 rounded-media border p-4 transition-colors duration-150 ${
                    state.headingStyle === s.id ? 'border-accent bg-accent/[0.06]' : 'border-line hover:border-accent/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="headingStyle"
                      value={s.id}
                      checked={state.headingStyle === s.id}
                      onChange={() => dispatch({ type: 'SET_HEADING_STYLE', style: s.id })}
                      className="accent-accent"
                    />
                    <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]">{s.label}</span>
                  </span>
                  <span className="font-mono text-[12px] text-muted">EXT. PLATS{headingSeparator(s.id)}DAG{s.id === 'period' ? '.' : ''}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Styr hur nya scenrubriker skrivs av autocomplete. Befintliga rubriker i manuset tolkas oavsett stil.
            </p>
          </fieldset>
        </div>

        <footer className="flex items-center justify-end border-t border-white/10 px-6 py-5">
          <Button variant="primary" size="md" onClick={close}>
            Klart
          </Button>
        </footer>
      </div>
    </div>
  );
}
