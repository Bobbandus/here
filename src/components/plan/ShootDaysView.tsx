import { useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppState';
import { formatEighths } from '../../fountain/parse';
import { todayIso, weekdayOf } from '../../state/projects';
import type { ShootDay } from '../../types';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { Panel } from '../ui/Panel';
import { formatDuration, totalDuration } from './shots';

type Draft = Omit<ShootDay, 'id'>;

function DayForm({ onDone }: { onDone: () => void }) {
  const { state, derived, dispatch } = useApp();
  const [draft, setDraft] = useState<Draft>({ date: todayIso(), call: '08:00', location: '', sceneIds: [] });

  const toggle = (id: string) =>
    setDraft((d) => ({ ...d, sceneIds: d.sceneIds.includes(id) ? d.sceneIds.filter((x) => x !== id) : [...d.sceneIds, id] }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.date) return;
    dispatch({ type: 'ADD_DAY', day: draft });
    dispatch({ type: 'TOAST', message: `Inspelningsdag ${draft.date} tillagd` });
    onDone();
  };

  return (
    <form onSubmit={submit}>
      <Panel
        title="Ny inspelningsdag"
        eyebrow
        footnote={`${draft.sceneIds.length} scener valda`}
        actions={
          <>
            <Button variant="quiet" onClick={onDone}>
              Avbryt
            </Button>
            <Button variant="primary" type="submit" disabled={!draft.date} className="ml-2">
              Spara dag
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-[160px_120px_1fr] gap-4">
          <Field label="Datum">
            {(id) => (
              <input id={id} type="date" className="field font-mono" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            )}
          </Field>
          <Field label="Samling">
            {(id) => (
              <input id={id} type="time" className="field font-mono" value={draft.call} onChange={(e) => setDraft({ ...draft, call: e.target.value })} />
            )}
          </Field>
          <Field label="Plats">
            {(id) => (
              <>
                <input
                  id={id}
                  className="field"
                  list="day-locations"
                  placeholder="Adress eller plats"
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
                <datalist id="day-locations">
                  {state.locations.map((l) => (
                    <option key={l.id} value={l.name} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
        </div>
        <fieldset className="mt-5">
          <legend className="micro mb-2.5 text-muted">Scener</legend>
          {derived.scenes.length === 0 ? (
            <p className="font-mono text-[0.72rem] text-muted">INGA SCENER I MANUSET ÄNNU</p>
          ) : (
            <div className="grid max-h-60 grid-cols-2 gap-x-4 overflow-y-auto rounded-media border border-line p-3">
              {derived.scenes.map((s) => (
                <label key={s.scene_id} className="flex cursor-pointer items-center gap-2 rounded-btn px-2 py-1.5 hover:bg-raised">
                  <input type="checkbox" className="accent-accent" checked={draft.sceneIds.includes(s.scene_id)} onChange={() => toggle(s.scene_id)} />
                  <span className="font-mono text-[0.7rem] text-accent">{s.scene_id}</span>
                  <span className="truncate text-[12px]">{s.scene_heading}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </Panel>
    </form>
  );
}

function DayCard({ day }: { day: ShootDay }) {
  const { state, derived, dispatch, goToScene } = useApp();
  const [confirm, setConfirm] = useState(false);
  const scenes = day.sceneIds.map((id) => derived.sceneById[id]).filter((s): s is NonNullable<typeof s> => !!s);
  const pages = scenes.reduce((a, s) => a + s.page_length, 0);
  const shots = day.sceneIds.flatMap((id) => state.shots[id] ?? []);
  const available = derived.scenes.filter((s) => !day.sceneIds.includes(s.scene_id));
  const patch = (p: Partial<ShootDay>) => dispatch({ type: 'UPDATE_DAY', id: day.id, patch: p });

  return (
    <article className="grid grid-cols-[150px_minmax(0,1fr)_170px] gap-6 rounded-panel border border-line bg-surface p-6">
      <div className="flex flex-col gap-2.5">
        <input
          type="date"
          aria-label="Datum"
          className="field h-9 border-transparent bg-transparent px-0 font-mono text-[1rem] font-bold text-gold hover:border-line focus:px-2"
          value={day.date}
          onChange={(e) => e.target.value && patch({ date: e.target.value })}
        />
        <span className="micro text-muted">{weekdayOf(day.date)}</span>
        <label className="flex items-center gap-2">
          <MonoLabel tone="muted">Samling</MonoLabel>
          <input type="time" className="field h-8 w-[96px] font-mono text-[12px]" value={day.call} onChange={(e) => patch({ call: e.target.value })} />
        </label>
      </div>

      <div className="flex min-w-0 flex-col gap-3.5">
        <input
          aria-label="Plats"
          className="field h-9 border-transparent bg-transparent px-1 font-display text-[15px] font-bold hover:border-line"
          placeholder="Plats ej satt"
          value={day.location}
          onChange={(e) => patch({ location: e.target.value })}
        />
        <ul className="flex flex-wrap gap-2">
          {scenes.length === 0 && <li className="font-mono text-[0.7rem] text-muted">INGA SCENER</li>}
          {scenes.map((s) => (
            <li key={s.scene_id} className="inline-flex items-center rounded-full border border-line bg-raised pl-3 pr-1">
              <button
                type="button"
                onClick={() => goToScene(s.scene_id, 'scene')}
                className="flex max-w-[260px] items-center gap-1.5 py-1.5 text-[12px] hover:underline"
              >
                <span className="font-mono text-[0.66rem] text-accent">{s.scene_id}</span>
                <span className="truncate">{s.location || s.scene_heading}</span>
              </button>
              <button
                type="button"
                aria-label={`Ta bort ${s.scene_id} från dagen`}
                onClick={() => patch({ sceneIds: day.sceneIds.filter((x) => x !== s.scene_id) })}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-line hover:text-flare"
              >
                <Icon name="close" size={9} />
              </button>
            </li>
          ))}
        </ul>
        {available.length > 0 && (
          <select
            className="field h-8 w-[300px] font-mono text-[11px]"
            aria-label="Lägg till scen"
            value=""
            onChange={(e) => e.target.value && patch({ sceneIds: [...day.sceneIds, e.target.value] })}
          >
            <option value="">+ LÄGG TILL SCEN</option>
            {available.map((s) => (
              <option key={s.scene_id} value={s.scene_id}>
                {s.scene_id} · {s.scene_heading}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col justify-between gap-3 border-l border-line pl-5">
        <dl className="grid grid-cols-2 gap-y-2.5 font-mono text-[0.68rem] uppercase text-muted">
          <dt>Sidor</dt>
          <dd className="text-right text-text">{formatEighths(pages)}</dd>
          <dt>Tagningar</dt>
          <dd className="text-right text-text">{shots.length}</dd>
          <dt>Längd</dt>
          <dd className="text-right text-text">{formatDuration(totalDuration(shots))}</dd>
        </dl>
        {confirm ? (
          <span className="flex gap-1">
            <Button variant="danger" onClick={() => dispatch({ type: 'DELETE_DAY', id: day.id })}>
              Ta bort
            </Button>
            <Button variant="quiet" onClick={() => setConfirm(false)}>
              Avbryt
            </Button>
          </span>
        ) : (
          <Button variant="quiet" className="self-start hover:text-flare" onClick={() => setConfirm(true)} aria-label={`Ta bort inspelningsdag ${day.date}`}>
            <Icon name="trash" size={12} />
            Ta bort dag
          </Button>
        )}
      </div>
    </article>
  );
}

export function ShootDaysView() {
  const { state, derived, goToScene } = useApp();
  const [adding, setAdding] = useState(false);
  const scheduled = new Set(state.shootDays.flatMap((d) => d.sceneIds));
  const unscheduled = derived.scenes.filter((s) => !scheduled.has(s.scene_id));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <MonoLabel eyebrow>Inspelningsdagar</MonoLabel>
            <h2 className="mt-2.5 font-black text-[2rem] leading-[1.02] tracking-[-0.03em]">Inspelningsschema</h2>
            <p className="mt-2.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
              <span className="text-text">{state.shootDays.length}</span> dagar · <span className="text-text">{scheduled.size}</span> scener schemalagda ·{' '}
              <span className={unscheduled.length ? 'text-gold' : 'text-text'}>{unscheduled.length}</span> utan dag
            </p>
          </div>
          {!adding && (
            <Button variant="primary" size="md" onClick={() => setAdding(true)}>
              <Icon name="plus" size={12} />
              Ny inspelningsdag
            </Button>
          )}
        </div>

        {adding && <DayForm onDone={() => setAdding(false)} />}

        {state.shootDays.length === 0 && !adding && (
          <div className="rounded-panel border border-dashed border-line p-12 text-center">
            <MonoLabel tone="muted">Inga inspelningsdagar ännu</MonoLabel>
          </div>
        )}

        {state.shootDays.map((d) => (
          <DayCard key={d.id} day={d} />
        ))}

        {unscheduled.length > 0 && (
          <Panel title="Scener utan inspelningsdag" bodyClassName="p-5">
            <ul className="flex flex-wrap gap-2">
              {unscheduled.map((s) => (
                <li key={s.scene_id}>
                  <button
                    type="button"
                    onClick={() => goToScene(s.scene_id, 'scene')}
                    title={s.scene_heading}
                    className="rounded-full border border-line px-2.5 py-1 font-mono text-[0.64rem] text-accent transition-colors duration-150 hover:bg-raised"
                  >
                    {s.scene_id}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
