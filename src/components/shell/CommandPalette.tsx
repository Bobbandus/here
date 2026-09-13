import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../../state/AppState';
import { APP_LABEL, APP_VIEWS } from '../../state/views';
import { Icon } from '../ui/Icon';

type Mode = 'root' | 'scenes' | 'views' | 'projects';

interface Item {
  id: string;
  label: string;
  detail?: string;
  run: () => void;
}

export function CommandPalette() {
  const { state, dispatch, derived, goToScene } = useApp();
  const [mode, setMode] = useState<Mode>('root');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = state.paletteOpen;

  const close = () => dispatch({ type: 'SET_PALETTE', open: false });

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setMode('root');
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setQuery('');
    setIndex(0);
    inputRef.current?.focus();
  };

  const items: Item[] = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (mode === 'scenes') {
      const target = state.app === 'plan' ? 'scene' : 'write';
      return derived.scenes
        .filter(
          (s) =>
            !q || s.scene_id.includes(q) || s.scene_heading.includes(q) || s.characters_present.some((c) => c.includes(q)),
        )
        .map((s) => ({
          id: s.scene_id,
          label: `${s.scene_id}  ${s.scene_heading}`,
          detail: target === 'write' && s.hasText ? 'WRITE' : 'PLAN',
          run: () => {
            goToScene(s.scene_id, target === 'write' && !s.hasText ? 'scene' : target);
            close();
          },
        }));
    }
    if (mode === 'views') {
      return (['write', 'plan', 'shoot'] as const)
        .flatMap((app) => APP_VIEWS[app].map((v) => ({ app, v })))
        .filter(({ app, v }) => !q || `${APP_LABEL[app]} ${v.label}`.toUpperCase().includes(q))
        .map(({ app, v }) => ({
          id: v.id,
          label: `A+ ${APP_LABEL[app]} · ${v.label}`,
          detail: state.view === v.id && state.app !== 'home' ? 'AKTIV' : undefined,
          run: () => {
            if (!state.hasProject) dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: true });
            else dispatch({ type: 'SET_VIEW', view: v.id });
            close();
          },
        }));
    }
    if (mode === 'projects') {
      return state.projects
        .filter((p) => !q || p.title.includes(q))
        .map((p) => ({
          id: p.id,
          label: p.title,
          detail: state.project.id === p.id ? 'AKTIVT' : p.format.toUpperCase(),
          run: () => {
            dispatch({ type: 'OPEN_PROJECT', id: p.id, app: state.app === 'home' ? 'write' : state.app });
            close();
          },
        }));
    }
    const root: Item[] = [
      ...(state.hasProject
        ? [
            { id: 'goto', label: 'Gå till scen…', detail: `${derived.scenes.length} SCENER`, run: () => switchMode('scenes') },
            {
              id: 'bible',
              label: 'Visa story bible',
              run: () => {
                dispatch({ type: 'SET_VIEW', view: 'write' });
                dispatch({ type: 'SET_RIGHT', open: true });
                close();
              },
            },
          ]
        : []),
      { id: 'view', label: 'Byt vy…', detail: 'WRITE · PLAN · SHOOT', run: () => switchMode('views') },
      { id: 'project', label: 'Byt projekt…', detail: `${state.projects.length} PROJEKT`, run: () => switchMode('projects') },
      {
        id: 'new',
        label: 'Nytt projekt…',
        run: () => dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: true }),
      },
      {
        id: 'home',
        label: 'Till startsidan',
        run: () => {
          dispatch({ type: 'SET_APP', app: 'home' });
          close();
        },
      },
      {
        id: 'settings',
        label: 'Inställningar…',
        run: () => {
          dispatch({ type: 'SET_SETTINGS_OPEN', open: true });
          close();
        },
      },
    ];
    return root.filter((i) => !q || i.label.toUpperCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query, derived.scenes, state.view, state.app, state.projects, state.project.id, state.hasProject]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    document.getElementById(`cmd-opt-${index}`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[index]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (mode !== 'root') switchMode('root');
      else close();
    } else if (e.key === 'Backspace' && !query && mode !== 'root') {
      switchMode('root');
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  const modeLabel: Record<Mode, string> = { root: '', scenes: 'SCEN /', views: 'VY /', projects: 'PROJEKT /' };
  const placeholder =
    mode === 'scenes'
      ? 'SÖK SCEN, RUBRIK ELLER KARAKTÄR'
      : mode === 'views'
        ? 'VÄLJ VY'
        : mode === 'projects'
          ? 'VÄLJ PROJEKT'
          : 'SKRIV ETT KOMMANDO';

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 pt-[14vh]" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kommandopalett"
        onMouseDown={(e) => e.stopPropagation()}
        className="glass-strong w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-panel"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4">
          <Icon name="search" size={16} className="text-muted" />
          {mode !== 'root' && <span className="micro shrink-0 text-accent">{modeLabel[mode]}</span>}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Kommando"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={items.length ? `cmd-opt-${index}` : undefined}
            className="h-12 flex-1 bg-transparent font-mono text-[0.82rem] text-text outline-none placeholder:text-muted focus-visible:outline-none"
          />
          <kbd className="font-mono text-[0.64rem] text-muted">ESC</kbd>
        </div>
        <ul id="cmd-list" role="listbox" aria-label="Kommandon" className="max-h-[340px] overflow-y-auto p-1.5">
          {items.length === 0 && <li className="px-3 py-3 font-mono text-[0.74rem] text-muted">INGA TRÄFFAR</li>}
          {items.map((item, i) => (
            <li
              key={item.id}
              id={`cmd-opt-${i}`}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => item.run()}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[6px] px-3 py-2 font-mono text-[0.78rem] ${
                i === index ? 'bg-accent text-accentInk' : 'text-text'
              }`}
            >
              <span className="truncate whitespace-pre">{item.label}</span>
              {item.detail && (
                <span className={`shrink-0 text-[0.64rem] tracking-[0.1em] ${i === index ? 'text-accentInk' : 'text-muted'}`}>
                  {item.detail}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
