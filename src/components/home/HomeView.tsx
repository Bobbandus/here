import { useMemo, useState } from 'react';
import { derive, useApp } from '../../state/AppState';
import { relativeTime } from '../../state/projects';
import { APP_LABEL } from '../../state/views';
import { DEMO_PROJECT_ID } from '../../data/project';
import { formatEighths } from '../../fountain/parse';
import type { ProjectData } from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';

interface AppTileProps {
  app: 'write' | 'plan' | 'shoot';
  eyebrow: string;
  description: string;
  features: string[];
}

function AppTile({ app, eyebrow, description, features }: AppTileProps) {
  const { state, dispatch } = useApp();
  const open = () => {
    if (!state.hasProject) dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: true });
    else dispatch({ type: 'OPEN_PROJECT', id: state.project.id, app });
  };
  return (
    <button
      type="button"
      onClick={open}
      className="card group flex flex-col gap-6 p-9 text-left transition-colors duration-150 hover:border-accent/60 hover:bg-raised"
    >
      <MonoLabel eyebrow>{eyebrow}</MonoLabel>
      <span className="flex items-baseline gap-3 leading-none">
        <span className="font-black text-[3.6rem] tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <span className="font-mono text-[1.8rem] font-bold tracking-[0.3em]">{APP_LABEL[app]}</span>
      </span>
      <span className="max-w-[440px] text-[15.5px] leading-relaxed text-muted">{description}</span>
      <span className="flex flex-wrap gap-2">
        {features.map((f) => (
          <Chip key={f}>{f}</Chip>
        ))}
      </span>
      <span className="mt-auto flex items-center justify-between border-t border-line pt-5 font-mono text-[0.72rem] uppercase tracking-[0.08em]">
        <span className="text-muted">
          {state.hasProject ? (
            <>
              Projekt <span className="text-text">{state.project.title}</span>
            </>
          ) : (
            'Inget projekt valt'
          )}
        </span>
        <span className="text-accent transition-transform duration-150 group-hover:translate-x-1">
          {state.hasProject ? 'Öppna →' : 'Skapa projekt →'}
        </span>
      </span>
    </button>
  );
}

function ProjectCardSmall({ p, stats }: { p: ProjectData; stats: { scenes: number; pages: string; shots: number; days: number } }) {
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState(false);
  const active = state.hasProject && state.project.id === p.id;

  return (
    <article className={`card relative flex flex-col gap-4 p-6 ${active ? 'border-accent/60' : ''}`}>
      {active && <span aria-hidden="true" className="absolute inset-y-4 left-0 w-[2px] bg-accent" />}
      <div className="flex items-center gap-2">
        <Chip>{p.format}</Chip>
        {active && <Chip tone="accentOutline">Aktivt</Chip>}
        {p.id === DEMO_PROJECT_ID && <Chip tone="goldOutline">Exempel</Chip>}
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-black text-[1.7rem] leading-[1.02] tracking-[-0.03em]">{p.title}</h3>
        <p className="mt-1.5 truncate text-muted">
          {p.subtitle} · utkast {p.draft}
        </p>
      </div>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-muted">
        <span className="text-text">{stats.scenes}</span> scener · <span className="text-text">{stats.pages}</span> sid ·{' '}
        <span className="text-text">{stats.shots}</span> tagningar · <span className="text-text">{stats.days}</span> dagar
      </p>
      <p className="font-mono text-[0.64rem] uppercase tracking-[0.08em] text-muted">Ändrad {relativeTime(p.updatedAt)}</p>
      <div className="mt-auto flex items-center gap-1.5 border-t border-line pt-4">
        <Button variant="quiet" onClick={() => dispatch({ type: 'OPEN_PROJECT', id: p.id, app: 'write' })}>
          Write →
        </Button>
        <Button variant="quiet" onClick={() => dispatch({ type: 'OPEN_PROJECT', id: p.id, app: 'plan' })}>
          Plan →
        </Button>
        <Button variant="quiet" onClick={() => dispatch({ type: 'OPEN_PROJECT', id: p.id, app: 'shoot' })}>
          Shoot →
        </Button>
        <span className="ml-auto flex gap-1">
          {confirm ? (
            <>
              <Button variant="danger" onClick={() => dispatch({ type: 'DELETE_PROJECT', id: p.id })}>
                Ta bort
              </Button>
              <Button variant="quiet" onClick={() => setConfirm(false)}>
                Avbryt
              </Button>
            </>
          ) : (
            <Button variant="quiet" aria-label={`Ta bort projektet ${p.title}`} onClick={() => setConfirm(true)} className="hover:text-flare">
              Ta bort
            </Button>
          )}
        </span>
      </div>
    </article>
  );
}

export function HomeView() {
  const { state, dispatch } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const summaries = useMemo(
    () =>
      state.projects.map((p) => {
        const d = derive(p);
        const pages = d.totalPages < 10 ? formatEighths(d.totalPages) : String(Math.round(d.totalPages));
        return { p, stats: { scenes: d.scenes.length, pages, shots: d.shotCount, days: p.shootDays.length } };
      }),
    [state.projects],
  );

  return (
    <div className="h-full overflow-y-auto">
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
        aria-label="Inställningar"
        className="fixed right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-btn border border-line bg-surface text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
      >
        <Icon name="cog" size={16} />
      </button>
      <main className="mx-auto flex max-w-[1160px] flex-col px-5 pb-20 pt-[8vh] sm:px-10 sm:pt-[10vh]">
        <h1
          aria-label="A+"
          className="select-none font-black text-[clamp(4.5rem,24vw,21rem)] leading-[0.78] tracking-[-0.06em]"
        >
          A<span className="text-accent">+</span>
        </h1>

        <section aria-label="Verktyg" className="mt-10 grid grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-3 sm:gap-8">
          <AppTile
            app="write"
            eyebrow="Skriva"
            description="Manus i Fountain med autocomplete, scenstruktur och story bible. Det du skriver blir scener som följer med hela vägen till inspelning."
            features={['Fountain', 'Scenrail', 'Story bible', 'Autocomplete']}
          />
          <AppTile
            app="plan"
            eyebrow="Planera"
            description="Shotlistor, cast, rekvisita, kamera och ljud per scen. Inspelningsdagar och pipeline från pre-pro till post."
            features={['Shotlistor', 'Inspelningsdagar', 'Cast & rekvisita', 'Pipeline']}
          />
          <AppTile
            app="shoot"
            eyebrow="Filma"
            description="Digital klapperbräda för inspelningsplatsen. Pip, tyst-ansägning och scen/tagning på NATO-alfabetet, klappen synkar tidskoden."
            features={['Klapperbräda', 'NATO-alfabet', 'Röstansägning', 'Tidskod']}
          />
        </section>

        <section aria-labelledby="projects-title" className="mt-14 sm:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <MonoLabel as="h2" id="projects-title" eyebrow>
                Projekt
              </MonoLabel>
              <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                {state.projects.length} {state.projects.length === 1 ? 'projekt' : 'projekt'} · sparas lokalt i den här webbläsaren
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: true })}>
              Nytt projekt
            </Button>
          </div>

          {summaries.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-panel border border-dashed border-line p-12 text-center">
              <MonoLabel tone="muted">Inga projekt ännu</MonoLabel>
              <p className="text-muted">Skapa ett projekt för att börja skriva och planera.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {summaries.map(({ p, stats }) => (
                <ProjectCardSmall key={p.id} p={p} stats={stats} />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted">
          <span>A+ Studios · Alingsås · lokal lagring · ingen AI kopplad</span>
          <span className="flex items-center gap-2">
            {confirmReset ? (
              <>
                <span>Skriv över KVAR med originalet?</span>
                <Button
                  variant="danger"
                  onClick={() => {
                    dispatch({ type: 'RESET_DEMO' });
                    dispatch({ type: 'TOAST', message: 'Exempelprojektet KVAR återställt' });
                    setConfirmReset(false);
                  }}
                >
                  Återställ
                </Button>
                <Button variant="quiet" onClick={() => setConfirmReset(false)}>
                  Avbryt
                </Button>
              </>
            ) : (
              <Button variant="quiet" onClick={() => setConfirmReset(true)}>
                Återställ exempelprojekt
              </Button>
            )}
            <span aria-hidden="true">·</span>
            <span>Ctrl K</span>
          </span>
        </footer>
      </main>
    </div>
  );
}
