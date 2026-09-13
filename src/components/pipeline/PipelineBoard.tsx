import { useMemo, useState } from 'react';
import { useApp } from '../../state/AppState';
import type { AppScene, Status } from '../../types';
import { formatEighths } from '../../fountain/parse';
import { MonoLabel } from '../ui/MonoLabel';
import { StageChip, STAGES } from './StageChip';

type Filter = 'all' | 'blocked' | 'ready';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'blocked', label: 'Bara blockerade' },
  { id: 'ready', label: 'Bara redo för inspelning' },
];

const isBlocked = (s: AppScene) => STAGES.some((st) => s.pipeline[st.id] === 'blocked');
const isReady = (s: AppScene) =>
  s.pipeline.write === 'done' && s.pipeline.prepro === 'done' && s.pipeline.production !== 'done' && !isBlocked(s);

const SEG: { status: Status; cls: string; label: string }[] = [
  { status: 'done', cls: 'bg-accent', label: 'klara' },
  { status: 'active', cls: 'bg-accentDim', label: 'pågår' },
  { status: 'blocked', cls: 'bg-flare', label: 'blockerade' },
  { status: 'todo', cls: 'bg-line', label: 'att göra' },
];

export function PipelineBoard() {
  const { derived, goToScene } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const scenes = derived.scenes;

  const rows = useMemo(
    () => scenes.filter((s) => (filter === 'blocked' ? isBlocked(s) : filter === 'ready' ? isReady(s) : true)),
    [scenes, filter],
  );

  const counts = useMemo(
    () =>
      STAGES.map((st) => {
        const c: Record<Status, number> = { done: 0, active: 0, todo: 0, blocked: 0 };
        for (const s of scenes) c[s.pipeline[st.id]]++;
        return { stage: st, c };
      }),
    [scenes],
  );

  const rowPages = rows.reduce((a, s) => a + s.page_length, 0);
  const rowChars = new Set(rows.flatMap((s) => s.characters_present)).size;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <MonoLabel eyebrow>Pipeline</MonoLabel>
            <h2 className="mt-2.5 font-black text-[2rem] leading-[1.02] tracking-[-0.03em]">Alla scener × fyra stadier</h2>
          </div>
          <div role="group" aria-label="Filter" className="flex gap-1 rounded-btn border border-line p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 rounded-btn px-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
                  filter === f.id ? 'bg-raised text-accent' : 'text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {counts.map(({ stage, c }) => (
            <div key={stage.id} className="rounded-panel border border-line bg-surface px-4 py-4">
              <div className="flex items-baseline justify-between">
                <MonoLabel tone="muted">{stage.label}</MonoLabel>
                <span className="font-mono text-[0.7rem] text-text">
                  {c.done}/{scenes.length}
                </span>
              </div>
              <div
                className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-line"
                role="img"
                aria-label={SEG.map((s) => `${c[s.status]} ${s.label}`).join(', ')}
              >
                {SEG.map((s) =>
                  c[s.status] ? (
                    <span key={s.status} className={s.cls} style={{ width: `${(c[s.status] / Math.max(1, scenes.length)) * 100}%` }} />
                  ) : null,
                )}
              </div>
              <div className="mt-2 flex gap-2 font-mono text-[0.62rem] text-muted">
                <span>{c.active} PÅGÅR</span>
                {c.blocked > 0 && <span className="text-flare">{c.blocked} BLOCK.</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-panel border border-line">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="h-11 border-b border-line">
                {['Scen', 'Rubrik', 'Sid', 'Karaktärer'].map((h) => (
                  <th key={h} scope="col" className="micro px-4 font-bold text-accent">
                    {h}
                  </th>
                ))}
                {STAGES.map((s) => (
                  <th key={s.id} scope="col" className="micro w-[120px] px-2 text-center text-accent">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.scene_id} className="h-12 border-b border-line/60 transition-colors duration-150 odd:bg-surface/50 hover:bg-raised">
                  <td className="px-4">
                    <button
                      type="button"
                      onClick={() => goToScene(s.scene_id, 'scene')}
                      className="font-mono text-[0.74rem] text-accent hover:underline"
                      aria-label={`Öppna ${s.scene_id} i scenvyn`}
                    >
                      {s.scene_id}
                    </button>
                  </td>
                  <td className="max-w-[300px] truncate px-4 text-[13.5px]">
                    {s.scene_heading}
                    {!s.hasText && <span className="ml-2 font-mono text-[0.6rem] text-muted">META</span>}
                  </td>
                  <td className="px-4 font-mono text-[0.72rem] text-muted">{formatEighths(s.page_length)}</td>
                  <td className="max-w-[200px] truncate px-4 font-mono text-[0.68rem] text-muted">
                    {s.characters_present.join(', ') || '—'}
                  </td>
                  {STAGES.map((st) => (
                    <td key={st.id} className="px-2 text-center">
                      <StageChip sceneId={s.scene_id} stage={st.id} status={s.pipeline[st.id]} />
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-mono text-[0.74rem] text-muted">
                    INGA SCENER MATCHAR FILTRET
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="h-16 border-t border-line bg-surface">
                <td className="px-4 font-black text-[1.3rem]">{rows.length}</td>
                <td className="micro px-4 text-muted">Scener totalt</td>
                <td className="px-4 font-black text-[1.3rem]">{Math.round(rowPages)}</td>
                <td className="px-4">
                  <span className="font-black text-[1.3rem]">{rowChars}</span>
                  <span className="micro ml-2 text-muted">roller</span>
                </td>
                {STAGES.map((st) => (
                  <td key={st.id} className="px-2 text-center">
                    <span className="font-black text-[1.3rem]">{rows.filter((r) => r.pipeline[st.id] === 'done').length}</span>
                    <span className="ml-1 font-mono text-[0.66rem] text-muted">KLARA</span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
