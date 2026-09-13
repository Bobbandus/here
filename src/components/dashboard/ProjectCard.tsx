import { useApp } from '../../state/AppState';
import { PROJECT_FORMATS } from '../../state/projects';
import type { PipelineStage, ProjectFormat, Status } from '../../types';
import { Button } from '../ui/Button';
import { MonoLabel } from '../ui/MonoLabel';
import { currentStage, STAGES, STATUS_LABEL } from '../pipeline/StageChip';

const segColor: Record<PipelineStage, string> = {
  write: 'bg-accent',
  prepro: 'bg-gold',
  production: 'bg-flare',
  post: 'bg-muted',
};

const statusColor: Record<Status, string> = {
  done: 'bg-accent',
  active: 'bg-accentDim',
  blocked: 'bg-flare',
  todo: 'bg-line',
};

const inline =
  'rounded-btn border border-transparent bg-transparent outline-none transition-colors duration-150 hover:border-line focus:border-accent';

export function ProjectCard({ variant }: { variant: 'write' | 'plan' }) {
  const { state, derived, dispatch } = useApp();
  const p = state.project;
  const total = derived.scenes.length;
  const safe = Math.max(1, total);

  const segments =
    variant === 'plan'
      ? STAGES.map((s) => ({
          key: s.id,
          label: s.label,
          cls: segColor[s.id],
          count: derived.scenes.filter((sc) => currentStage(sc.pipeline) === s.id).length,
        }))
      : (['done', 'active', 'blocked', 'todo'] as Status[]).map((st) => ({
          key: st,
          label: STATUS_LABEL[st],
          cls: statusColor[st],
          count: derived.scenes.filter((sc) => sc.pipeline.write === st).length,
        }));

  return (
    <section aria-labelledby="project-title" className="card p-8">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <MonoLabel eyebrow>{variant === 'write' ? 'A+ Write · projekt' : 'A+ Plan · projekt'}</MonoLabel>
          <h2 id="project-title" className="mt-4">
            <input
              aria-label="Projekttitel"
              className={`${inline} -mx-1 w-full max-w-[640px] px-1 font-black text-[2.6rem] uppercase leading-[1.02] tracking-[-0.03em]`}
              value={p.title}
              onChange={(e) => dispatch({ type: 'UPDATE_PROJECT_INFO', patch: { title: e.target.value.toUpperCase() } })}
            />
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-muted">
            <input
              aria-label="Undertitel"
              className={`${inline} -mx-1 w-[260px] px-1 py-0.5`}
              value={p.subtitle}
              onChange={(e) => dispatch({ type: 'UPDATE_PROJECT_INFO', patch: { subtitle: e.target.value } })}
            />
            <span aria-hidden="true">·</span>
            <select
              aria-label="Format"
              className={`${inline} bg-surface py-0.5`}
              value={p.format}
              onChange={(e) => dispatch({ type: 'UPDATE_PROJECT_INFO', patch: { format: e.target.value as ProjectFormat } })}
            >
              {PROJECT_FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <span aria-hidden="true">·</span>
            <label className="flex items-center gap-1">
              utkast
              <input
                type="number"
                min={1}
                aria-label="Utkastnummer"
                className={`${inline} w-12 px-1 py-0.5 font-mono`}
                value={p.draft}
                onChange={(e) => dispatch({ type: 'UPDATE_PROJECT_INFO', patch: { draft: Math.max(1, Number(e.target.value) || 1) } })}
              />
            </label>
          </div>
          <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
            {p.studio} · FOUNTAIN · {total} SCENER · SENAST ÄNDRAD <span className="text-text">{state.lastEdited}</span>
          </p>
        </div>
        {variant === 'write' ? (
          <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SET_VIEW', view: 'write' })}>
            Fortsätt skriva →
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SET_VIEW', view: 'shots' })}>
            Öppna shotlistor →
          </Button>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <MonoLabel tone="muted">{variant === 'plan' ? 'Scener per stadium' : 'Skrivstatus per scen'}</MonoLabel>
          <span className="font-mono text-[0.68rem] text-muted">{total} TOTALT</span>
        </div>
        <div
          className="mt-3 flex h-3 gap-[2px] overflow-hidden rounded-[3px] bg-raised"
          role="img"
          aria-label={segments.map((s) => `${s.label}: ${s.count} scener`).join(', ')}
        >
          {segments.map((s) =>
            s.count ? <span key={s.key} className={s.cls} style={{ width: `${(s.count / safe) * 100}%` }} /> : null,
          )}
        </div>
        <ul className="mt-3 flex gap-7">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
              <span aria-hidden="true" className={`h-2 w-2 rounded-[2px] ${s.cls}`} />
              {s.label}
              <span className="text-text">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
