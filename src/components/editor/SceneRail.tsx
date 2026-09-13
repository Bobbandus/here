import { useMemo, useState } from 'react';
import { useApp } from '../../state/AppState';
import { formatEighths } from '../../fountain/parse';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { StageDots } from '../pipeline/StageChip';

interface SceneRailProps {
  onCollapse: () => void;
}

export function SceneRail({ onCollapse }: SceneRailProps) {
  const { state, derived, dispatch, goToScene } = useApp();
  const [query, setQuery] = useState('');
  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of state.characters) m[c.name] = c.color;
    return m;
  }, [state.characters]);

  const q = query.trim().toUpperCase();
  const scenes = derived.scenes.filter(
    (s) => !q || s.scene_heading.includes(q) || s.characters_present.some((c) => c.includes(q)) || s.scene_id.includes(q),
  );
  const activeId = state.cursor.sceneId ?? state.selectedSceneId;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
        <MonoLabel eyebrow>Scener</MonoLabel>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Dölj scenlistan"
          className="flex h-8 items-center gap-1 rounded-btn px-2 font-mono text-[0.64rem] text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
        >
          <Icon name="chevronLeft" size={12} />
          DÖLJ
        </button>
      </div>
      <div className="shrink-0 border-b border-line p-3">
        <input
          type="search"
          className="field font-mono text-[0.72rem] placeholder:tracking-[0.1em]"
          placeholder="FILTRERA SCENER"
          aria-label="Filtrera scener på rubrik eller karaktär"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1.5" aria-label="Scenlista">
        {scenes.map((s) => {
          const active = s.scene_id === activeId;
          return (
            <li key={s.scene_id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  if (s.hasText && s.headingLine !== null) {
                    dispatch({ type: 'SELECT_SCENE', sceneId: s.scene_id });
                    dispatch({ type: 'JUMP', line: s.headingLine });
                  } else {
                    goToScene(s.scene_id, 'scene');
                  }
                }}
                className={`relative block w-full px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-offset-[-2px] ${
                  active ? 'bg-raised' : 'hover:bg-raised/60'
                } ${s.hasText ? '' : 'opacity-60'}`}
              >
                {active && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[2px] bg-accent" />}
                <span className="grid grid-cols-[50px_minmax(0,1fr)] items-baseline gap-x-2">
                  <span className="font-mono text-[0.7rem] text-accent">{s.scene_id}</span>
                  <span className="truncate text-[12.5px] text-text">{s.scene_heading}</span>
                  <span className="col-start-2 mt-1 flex min-w-0 items-center gap-1.5 font-mono text-[0.68rem] text-muted">
                    <span className="min-w-0 truncate">
                      {s.characters_present.length === 0 && '—'}
                      {s.characters_present.map((c, i) => (
                        <span key={c}>
                          {i > 0 && ', '}
                          <span style={{ color: colorOf[c] ?? undefined }}>{c}</span>
                        </span>
                      ))}
                    </span>
                    <span className="shrink-0">· {formatEighths(s.page_length)} s ·</span>
                    <span className="shrink-0">
                      <StageDots pipeline={s.pipeline} />
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {scenes.length === 0 && <li className="px-5 py-4 font-mono text-[0.7rem] text-muted">INGA TRÄFFAR</li>}
      </ul>
    </div>
  );
}
