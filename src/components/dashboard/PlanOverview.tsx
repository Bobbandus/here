import { useApp } from '../../state/AppState';
import { todayIso, weekdayOf } from '../../state/projects';
import { Button } from '../ui/Button';
import { MonoLabel } from '../ui/MonoLabel';
import { Panel } from '../ui/Panel';
import { formatDuration, totalDuration } from '../plan/shots';
import { ProjectCard } from './ProjectCard';
import { StatTile } from './StatTile';

export function PlanOverview() {
  const { state, derived, dispatch, goToScene } = useApp();
  const allShots = Object.values(state.shots).flat();
  const today = todayIso();
  const upcoming = state.shootDays.filter((d) => d.date >= today);
  const days = (upcoming.length ? upcoming : state.shootDays).slice(0, 3);
  const scheduled = new Set(state.shootDays.flatMap((d) => d.sceneIds));
  const todos = derived.todos;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1160px] grid-cols-12 gap-8 p-8">
        <div className="col-span-12">
          <ProjectCard variant="plan" />
        </div>

        <div className="col-span-12 grid grid-cols-4 gap-6">
          <StatTile label="Scener" value={derived.scenes.length} note={`${scheduled.size} SCHEMALAGDA`} />
          <StatTile label="Tagningar" value={allShots.length} note={`${formatDuration(totalDuration(allShots))} PLANERAT`} />
          <StatTile label="Inspelningsdagar" value={state.shootDays.length} note={upcoming[0] ? `NÄSTA ${upcoming[0].date}` : 'INGEN KOMMANDE'} />
          <StatTile label="Öppna punkter" value={todos.length} note={`${todos.filter((t) => t.severity === 'flare').length} KRITISKA`} />
        </div>

        <div className="col-span-7">
          <Panel title="Att göra i produktion" eyebrow bodyClassName="py-1.5">
            {todos.length === 0 ? (
              <p className="px-5 py-5 font-mono text-[0.72rem] text-muted">INGA ÖPPNA PUNKTER</p>
            ) : (
              <ul>
                {todos.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex min-h-[56px] items-center gap-4 border-b border-line/60 px-5 last:border-b-0">
                    <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.severity === 'flare' ? 'bg-flare' : 'bg-gold'}`} />
                    <span className="flex-1 text-[13.5px]">
                      <span className="font-mono text-[0.74rem] text-accent">{t.sceneId}</span>
                      {t.text.slice(t.sceneId.length)}
                    </span>
                    <Button
                      variant="quiet"
                      onClick={() => goToScene(t.sceneId, t.id.endsWith('-shots') ? 'shots' : 'scene')}
                      aria-label={`Öppna scen ${t.sceneId}`}
                    >
                      Öppna scen
                    </Button>
                  </li>
                ))}
                {todos.length > 8 && (
                  <li className="px-5 py-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
                    +{todos.length - 8} punkter till · se pipeline
                  </li>
                )}
              </ul>
            )}
          </Panel>
        </div>

        <section className="col-span-5" aria-labelledby="shootdays-title">
          <div className="flex items-center justify-between">
            <MonoLabel as="h2" id="shootdays-title" eyebrow>
              Inspelningsdagar
            </MonoLabel>
            <Button variant="quiet" onClick={() => dispatch({ type: 'SET_VIEW', view: 'days' })}>
              Alla dagar →
            </Button>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {days.length === 0 && (
              <div className="rounded-panel border border-dashed border-line p-6 text-center">
                <p className="font-mono text-[0.72rem] text-muted">INGA INSPELNINGSDAGAR</p>
              </div>
            )}
            {days.map((d) => (
              <article key={d.id} className="rounded-panel border border-line bg-surface p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[1rem] font-bold text-gold">{d.date}</span>
                  <span className="micro text-muted">
                    {weekdayOf(d.date)} · SAMLING {d.call}
                  </span>
                </div>
                <p className="mt-2 font-display font-bold">{d.location || 'Plats ej satt'}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {d.sceneIds.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => goToScene(id, 'scene')}
                        className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.64rem] text-accent transition-colors duration-150 hover:bg-raised"
                      >
                        {id}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
