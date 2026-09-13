import { useMemo, useState } from 'react';
import { useApp } from '../state/AppState';
import { formatEighths } from '../fountain/parse';
import { clampFocal, isZoomLens } from '../data/production';
import type { AppScene, PipelineStage, Shot, Status } from '../types';
import { lensGear, MOVEMENTS, SHOT_TYPE_LABEL, SHOT_TYPES, shotLetter } from '../components/plan/shots';
import { ShotFrameIcon } from '../components/plan/ShotFrameIcon';
import { Icon } from '../components/ui/Icon';
import { inputClass, MHeader } from './ui';

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'write', label: 'Manus' },
  { id: 'prepro', label: 'Pre-pro' },
  { id: 'production', label: 'Inspelning' },
  { id: 'post', label: 'Post' },
];

const STATUS_LABEL: Record<Status, string> = { todo: 'Att göra', active: 'Pågår', done: 'Klar', blocked: 'Blockerad' };
const STATUS_CLASS: Record<Status, string> = {
  todo: 'border-line text-muted',
  active: 'border-gold/60 text-gold',
  done: 'border-accent/60 text-accent',
  blocked: 'border-flare/60 text-flare',
};
const DOT_CLASS: Record<Status, string> = { todo: 'bg-line', active: 'bg-gold', done: 'bg-accent', blocked: 'bg-flare' };

const selectClass = `${inputClass} appearance-none pr-10`;

function ShotCard({ sceneId, shot, code, first, last }: { sceneId: string; shot: Shot; code: string; first: boolean; last: boolean }) {
  const { state, dispatch } = useApp();
  const lenses = useMemo(() => lensGear(state.gear), [state.gear]);
  const lens = lenses.find((l) => l.id === shot.lensId);
  const update = (patch: Partial<Shot>) => dispatch({ type: 'UPDATE_SHOT', sceneId, id: shot.id, patch });

  return (
    <article className={`rounded-[16px] border border-line bg-surface p-4 ${shot.done ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[18px] font-bold text-accent">{code}</span>
        <ShotFrameIcon type={shot.type} size={34} className="text-muted" />
        <span className="min-w-0 flex-1 truncate text-[14px] text-muted">{SHOT_TYPE_LABEL[shot.type]}</span>
        <label className="flex h-11 items-center gap-2 pl-2">
          <span className="text-[14px] text-muted">Klar</span>
          <input type="checkbox" checked={shot.done} onChange={(e) => update({ done: e.target.checked })} className="h-6 w-6 accent-accent" />
        </label>
      </div>

      <textarea
        value={shot.description}
        onChange={(e) => update({ description: e.target.value })}
        placeholder="Vad ser vi?"
        rows={2}
        aria-label={`Beskrivning ${code}`}
        className="mt-3 w-full resize-none rounded-[12px] border border-line bg-ink px-4 py-3 text-[16px] leading-snug text-text outline-none placeholder:text-muted focus:border-accent"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="relative">
          <select value={shot.type} onChange={(e) => update({ type: e.target.value as Shot['type'] })} aria-label={`Bildutsnitt ${code}`} className={selectClass}>
            {SHOT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} · {SHOT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <Icon name="chevronRight" size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
        </div>
        <div className="relative">
          <select value={shot.movement} onChange={(e) => update({ movement: e.target.value })} aria-label={`Rörelse ${code}`} className={selectClass}>
            {MOVEMENTS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <Icon name="chevronRight" size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
        </div>
        <div className={`relative ${lens && isZoomLens(lens) ? '' : 'col-span-2'}`}>
          <select
            value={shot.lensId ?? ''}
            onChange={(e) => {
              const l = lenses.find((x) => x.id === e.target.value);
              update({ lensId: l?.id ?? null, focalMm: l ? l.focalMin : null });
            }}
            aria-label={`Objektiv ${code}`}
            className={selectClass}
          >
            <option value="">{lenses.length ? 'Välj objektiv' : 'Inga objektiv i utrustning'}</option>
            {lenses.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <Icon name="chevronRight" size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
        </div>
        {lens && isZoomLens(lens) && (
          <label className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={lens.focalMin}
              max={lens.focalMax}
              value={shot.focalMm ?? lens.focalMin}
              onChange={(e) => update({ focalMm: clampFocal(Number(e.target.value) || lens.focalMin, lens) })}
              aria-label={`Brännvidd ${code}`}
              className={`${inputClass} pr-12`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-muted">mm</span>
          </label>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        <button type="button" disabled={first} onClick={() => dispatch({ type: 'MOVE_SHOT', sceneId, id: shot.id, dir: -1 })} aria-label="Flytta upp" className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-raised disabled:opacity-30">
          <Icon name="arrowUp" size={18} />
        </button>
        <button type="button" disabled={last} onClick={() => dispatch({ type: 'MOVE_SHOT', sceneId, id: shot.id, dir: 1 })} aria-label="Flytta ner" className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-raised disabled:opacity-30">
          <Icon name="arrowDown" size={18} />
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`Ta bort tagning ${code}?`) && dispatch({ type: 'DELETE_SHOT', sceneId, id: shot.id })}
          className="ml-auto flex h-11 items-center gap-2 rounded-full px-3 text-[14px] text-flare active:bg-raised"
        >
          <Icon name="trash" size={16} />
          Ta bort
        </button>
      </div>
    </article>
  );
}

function SceneDetail({ scene, number, onBack, onSlate }: { scene: AppScene; number: number; onBack: () => void; onSlate: (scene: AppScene, number: number) => void }) {
  const { state, dispatch } = useApp();
  const shots = state.shots[scene.scene_id] ?? [];
  const done = shots.filter((s) => s.done).length;

  return (
    <div className="flex h-full flex-col">
      <MHeader onBack={onBack} title={scene.scene_heading} sub={`${scene.scene_id} · ${formatEighths(scene.page_length)} sid`} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
        <button
          type="button"
          onClick={() => onSlate(scene, number)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-accent text-[16px] font-bold text-accentInk active:scale-[0.98]"
        >
          <Icon name="clapper" size={18} />
          Klappa scen {number}
        </button>

        {scene.characters_present.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {scene.characters_present.map((c) => (
              <span key={c} className="rounded-full border border-line px-3 py-1.5 text-[13px]">
                {c}
              </span>
            ))}
          </div>
        )}

        <h3 className="mb-2 mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Status — tryck för att byta</h3>
        <div className="grid grid-cols-2 gap-2">
          {STAGES.map((st) => {
            const status = scene.pipeline[st.id];
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => dispatch({ type: 'CYCLE_STATUS', sceneId: scene.scene_id, stage: st.id })}
                className={`flex h-14 flex-col items-start justify-center rounded-[14px] border bg-surface px-4 text-left active:scale-[0.98] ${STATUS_CLASS[status]}`}
              >
                <span className="text-[12px] text-muted">{st.label}</span>
                <span className="text-[15px] font-bold">{STATUS_LABEL[status]}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-2 mt-6 flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Tagningar</h3>
          <span className="font-mono text-[12px] text-muted">
            {done}/{shots.length} klara
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {shots.map((s, i) => (
            <ShotCard key={s.id} sceneId={scene.scene_id} shot={s} code={`${number}${shotLetter(i)}`} first={i === 0} last={i === shots.length - 1} />
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: 'ADD_SHOT', sceneId: scene.scene_id })}
            className="flex h-14 items-center justify-center gap-2 rounded-[16px] border border-dashed border-line text-[16px] font-bold text-text active:bg-raised"
          >
            <Icon name="plus" size={16} />
            Ny tagning
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScenesTab({ onSlate }: { onSlate: (scene: AppScene, number: number) => void }) {
  const { state, derived } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const open = derived.scenes.find((s) => s.scene_id === openId);
  if (open) {
    return <SceneDetail scene={open} number={derived.scenes.indexOf(open) + 1} onBack={() => setOpenId(null)} onSlate={onSlate} />;
  }

  const q = query.trim().toUpperCase();
  const list = derived.scenes.filter(
    (s) => !q || s.scene_heading.toUpperCase().includes(q) || s.scene_id.includes(q) || s.characters_present.some((c) => c.includes(q)),
  );

  return (
    <div className="flex h-full flex-col">
      <MHeader title="Scener" sub={`${derived.scenes.length} scener · ${derived.shotCount} tagningar`} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="sticky top-0 z-10 bg-ink px-4 pb-3 pt-3">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök scen, plats eller karaktär" className={inputClass} aria-label="Sök scen" />
        </div>
        <ul className="flex flex-col gap-2 px-4 pb-8">
          {list.map((s) => {
            const n = derived.scenes.indexOf(s) + 1;
            const shots = state.shots[s.scene_id] ?? [];
            return (
              <li key={s.scene_id}>
                <button type="button" onClick={() => setOpenId(s.scene_id)} className="flex w-full flex-col gap-2 rounded-[16px] border border-line bg-surface p-4 text-left active:bg-raised">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-raised px-2 font-mono text-[13px] font-bold text-accent">{n}</span>
                    <span className="min-w-0 flex-1 text-[15px] font-bold leading-snug">{s.scene_heading}</span>
                    <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
                  </div>
                  <div className="flex items-center gap-3 pl-11 text-[13px] text-muted">
                    <span>{formatEighths(s.page_length)} sid</span>
                    <span>·</span>
                    <span>{shots.length} tagn.</span>
                    {!s.hasText && <span className="text-gold">· ingen text</span>}
                    <span className="ml-auto flex gap-1" aria-label="Status">
                      {STAGES.map((st) => (
                        <span key={st.id} className={`h-2 w-2 rounded-full ${DOT_CLASS[s.pipeline[st.id]]}`} />
                      ))}
                    </span>
                  </div>
                  {s.characters_present.length > 0 && <div className="truncate pl-11 text-[13px] text-muted">{s.characters_present.join(', ')}</div>}
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="py-12 text-center text-[15px] text-muted">Inga träffar</li>}
        </ul>
      </div>
    </div>
  );
}
