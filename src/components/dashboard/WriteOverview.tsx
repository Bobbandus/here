import { useApp } from '../../state/AppState';
import { MonoLabel } from '../ui/MonoLabel';
import { Panel } from '../ui/Panel';
import { ActivityList } from './ActivityList';
import { ProjectCard } from './ProjectCard';
import { StatTile } from './StatTile';

export function WriteOverview() {
  const { state, derived, dispatch } = useApp();
  const ranked = [...state.characters]
    .map((c) => ({ c, lines: derived.characterStats.find((s) => s.name === c.name.toUpperCase())?.lines ?? 0 }))
    .sort((a, b) => b.lines - a.lines);
  const maxLines = Math.max(1, ...ranked.map((r) => r.lines));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1160px] grid-cols-12 gap-8 p-8">
        <div className="col-span-12">
          <ProjectCard variant="write" />
        </div>

        <div className="col-span-12 grid grid-cols-4 gap-6">
          <StatTile label="Scener" value={derived.scenes.length} note={`${derived.textSceneCount} MED MANUSTEXT`} />
          <StatTile label="Sidor" value={Math.round(derived.totalPages)} unit="SID" />
          <StatTile label="Uppskattad speltid" value={derived.runtimeMin} unit="MIN" note="1 SIDA ≈ 1 MINUT" />
          <StatTile label="Karaktärer" value={derived.characterCount} note={`${state.characters.length} I STORY BIBLE`} />
        </div>

        <div className="col-span-7">
          <ActivityList />
        </div>

        <div className="col-span-5">
          <Panel title="Repliker per karaktär" eyebrow bodyClassName="px-5 py-4">
            {ranked.length === 0 ? (
              <div className="flex flex-col items-start gap-2.5">
                <p className="font-mono text-[0.72rem] text-muted">STORY BIBLE ÄR TOM</p>
                <button
                  type="button"
                  className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-accent hover:underline"
                  onClick={() => {
                    dispatch({ type: 'SET_VIEW', view: 'write' });
                    dispatch({ type: 'SET_RIGHT', open: true });
                    dispatch({ type: 'ADD_CHARACTER' });
                  }}
                >
                  Lägg till första karaktären →
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {ranked.slice(0, 8).map(({ c, lines }) => (
                  <li key={c.id} className="grid grid-cols-[110px_1fr_32px] items-center gap-3">
                    <span className="flex items-center gap-2 truncate font-display text-[13.5px] font-bold">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <span className="block h-full bg-accent" style={{ width: `${(lines / maxLines) * 100}%` }} />
                    </span>
                    <span className="text-right font-mono text-[0.7rem] text-muted">{lines}</span>
                  </li>
                ))}
              </ul>
            )}
            <MonoLabel tone="muted" className="mt-4 block">
              Räknat i manustexten
            </MonoLabel>
          </Panel>
        </div>
      </div>
    </div>
  );
}
