import { useApp } from '../../state/AppState';
import { APP_LABEL, viewLabel } from '../../state/views';
import { Icon } from '../ui/Icon';

export function TopBar() {
  const { state, derived, dispatch } = useApp();
  if (state.app === 'home') return null;
  const app = state.app;
  const showScene = state.view === 'write' || state.view === 'scene' || state.view === 'shots';
  const scene = showScene ? derived.sceneById[state.selectedSceneId] : undefined;

  const stats =
    app === 'write'
      ? [
          { label: 'SID', value: String(Math.round(derived.totalPages)), sr: 'Sidor' },
          { label: 'SCENER', value: String(derived.scenes.length), sr: 'Scener' },
          { label: 'MIN', value: `~${derived.runtimeMin}`, sr: 'Speltid' },
        ]
      : app === 'plan'
        ? [
            { label: 'SCENER', value: String(derived.scenes.length), sr: 'Scener' },
            { label: 'TAGNINGAR', value: String(derived.shotCount), sr: 'Tagningar' },
            { label: 'DAGAR', value: String(state.shootDays.length), sr: 'Inspelningsdagar' },
          ]
        : [];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-ink px-3 sm:gap-5 sm:px-6">
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_APP', app: 'home' })}
        className="flex shrink-0 items-baseline gap-2 leading-none"
        aria-label={`A+ ${APP_LABEL[app]}, till startsidan`}
      >
        <span className="font-black text-[22px] tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <span className="font-mono text-[10px] font-bold tracking-[0.3em]">{APP_LABEL[app]}</span>
      </button>
      <span aria-hidden="true" className="h-6 w-px bg-line" />
      <span className="hidden max-w-[220px] shrink-0 truncate font-display font-bold sm:block">{state.project.title}</span>
      <nav aria-label="Brödsmulor" className="hidden min-w-0 flex-1 sm:block">
        <ol className="flex min-w-0 items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-[0.06em] text-muted">
          <li className="shrink-0">{viewLabel(state.view)}</li>
          {scene && (
            <>
              <li aria-hidden="true">/</li>
              <li className="shrink-0 text-accent">{scene.scene_id}</li>
              <li aria-hidden="true">/</li>
              <li className="truncate text-text">{scene.scene_heading}</li>
            </>
          )}
        </ol>
      </nav>
      <dl className="hidden shrink-0 items-center gap-5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted lg:flex">
        {stats.map((s) => (
          <div key={s.label} className="flex gap-2">
            <dt className="sr-only">{s.sr}</dt>
            <dd className="text-text">{s.value}</dd>
            <span aria-hidden="true">{s.label}</span>
          </div>
        ))}
      </dl>
      <div role="group" aria-label="Byt verktyg" className="flex shrink-0 rounded-btn border border-line p-1">
        {(['write', 'plan', 'shoot'] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={app === a}
            onClick={() => dispatch({ type: 'SET_APP', app: a })}
            className={`h-7 rounded-[2px] px-3 font-mono text-[0.64rem] font-bold tracking-[0.14em] transition-colors duration-150 ${
              app === a ? 'bg-raised text-accent' : 'text-muted hover:text-text'
            }`}
          >
            {APP_LABEL[a]}
          </button>
        ))}
      </div>
      <span
        className="flex shrink-0 items-center gap-2 font-mono text-[0.68rem] font-bold tracking-[0.12em] text-accent"
        title={`Sparat lokalt i webbläsaren ${state.lastEdited}`}
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="hidden sm:inline">SPARAT</span>
      </span>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_PALETTE', open: true })}
        aria-label="Öppna kommandopalett (Ctrl+K)"
        className="hidden h-9 shrink-0 rounded-btn border border-line px-3 font-mono text-[0.68rem] text-muted transition-colors duration-150 hover:bg-raised hover:text-text md:block"
      >
        CTRL K
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
        aria-label="Inställningar"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn border border-line text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
      >
        <Icon name="cog" size={16} />
      </button>
    </header>
  );
}
