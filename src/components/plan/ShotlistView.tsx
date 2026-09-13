import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../state/AppState';
import { formatEighths } from '../../fountain/parse';
import { clampFocal, isZoomLens } from '../../data/production';
import type { Shot } from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { AiActionButton } from '../scene/AiActionButton';
import { AiPlaceholderPanel } from '../scene/AiPlaceholderPanel';
import { useAiInsert } from '../scene/useAiInsert';
import { EmptyScenes } from './EmptyScenes';
import { ShotTypePicker } from './ShotTypePicker';
import { formatDuration, lensGear, MOVEMENTS, shotLetter, totalDuration } from './shots';

const iconBtn =
  'flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-text disabled:opacity-30 disabled:hover:bg-transparent';

export function ShotlistView() {
  const { state, derived, dispatch, goToScene } = useApp();
  const scenes = derived.scenes;
  const index = Math.max(0, scenes.findIndex((s) => s.scene_id === state.selectedSceneId));
  const scene = scenes[index];
  const sceneId = scene?.scene_id ?? '';
  const shots = state.shots[sceneId] ?? [];
  const onInsert = useAiInsert(sceneId);
  const availableLenses = useMemo(() => lensGear(state.gear), [state.gear]);

  // Fokusera beskrivningen på en nyss tillagd tagning.
  const prevCount = useRef({ sceneId, count: shots.length });
  useEffect(() => {
    const prev = prevCount.current;
    if (prev.sceneId === sceneId && shots.length > prev.count) {
      document.getElementById(`shot-desc-${shots[shots.length - 1].id}`)?.focus();
    }
    prevCount.current = { sceneId, count: shots.length };
  }, [sceneId, shots]);

  if (!scene) return <EmptyScenes />;

  const sceneNo = index + 1;
  const allShots = Object.values(state.shots).flat();
  const scenesWithShots = Object.entries(state.shots).filter(([, l]) => l.length > 0).length;
  const doneCount = shots.filter((s) => s.done).length;
  const update = (id: string, patch: Partial<Shot>) =>
    dispatch({ type: 'UPDATE_SHOT', sceneId, id, patch });

  return (
    <div className="relative grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)]">
      <aside aria-label="Scener" className="flex min-h-0 flex-col border-r border-line bg-surface">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <MonoLabel eyebrow>Scener</MonoLabel>
          <span className="font-mono text-[0.64rem] text-muted">{allShots.length} TAGN.</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1.5">
          {scenes.map((s) => {
            const n = state.shots[s.scene_id]?.length ?? 0;
            const active = s.scene_id === sceneId;
            return (
              <li key={s.scene_id}>
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => dispatch({ type: 'SELECT_SCENE', sceneId: s.scene_id })}
                  className={`relative grid w-full grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-offset-[-2px] ${
                    active ? 'bg-raised' : 'hover:bg-raised/60'
                  }`}
                >
                  {active && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[2px] bg-accent" />}
                  <span className="font-mono text-[0.7rem] text-accent">{s.scene_id}</span>
                  <span className="truncate text-[12.5px]">{s.scene_heading}</span>
                  <span className={`font-mono text-[0.66rem] ${n ? 'text-text' : 'text-muted'}`}>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section aria-labelledby="shotlist-title" className="flex min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-line px-8 py-5">
          <div className="min-w-0 flex-1">
            <MonoLabel eyebrow>Shotlista</MonoLabel>
            <h2 id="shotlist-title" className="mt-2 flex items-baseline gap-3 font-black text-[1.7rem] leading-[1.02] tracking-[-0.03em]">
              <span className="font-mono text-[1rem] font-bold tracking-normal text-accent">{scene.scene_id}</span>
              <span className="truncate">{scene.scene_heading}</span>
            </h2>
            <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
              {formatEighths(scene.page_length)} sid · {scene.characters_present.join(', ') || 'inga karaktärer'} ·{' '}
              <button type="button" className="text-accent hover:underline" onClick={() => goToScene(sceneId, 'scene')}>
                scenpanel →
              </button>
            </p>
          </div>
          <AiActionButton kind="shotlist" label="Generera shotlist" />
          <Button variant="primary" size="md" onClick={() => dispatch({ type: 'ADD_SHOT', sceneId })}>
            <Icon name="plus" size={12} />
            Ny tagning
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-8 py-5">
          {availableLenses.length === 0 && (
            <p className="mb-4 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-gold">
              Inga objektiv i gear-listan ännu — lägg till under{' '}
              <button
                type="button"
                className="underline hover:text-text"
                onClick={() => dispatch({ type: 'SET_VIEW', view: 'gear' })}
              >
                Plan → Utrustning
              </button>{' '}
              (kategori "Objektiv") för att kunna välja lins här.
            </p>
          )}
          {shots.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-line p-12 text-center">
              <MonoLabel tone="muted">Ingen shotlista för {sceneId}</MonoLabel>
              <p className="max-w-[420px] text-muted">Lägg till tagningar en i taget. Numreringen följer scennumret: {sceneNo}A, {sceneNo}B …</p>
              <Button variant="ghost" onClick={() => dispatch({ type: 'ADD_SHOT', sceneId })}>
                <Icon name="plus" size={12} />
                Första tagningen
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-panel border border-line">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface">
                  <tr className="h-11 border-b border-line">
                    {['Nr', 'Klar', 'Typ', 'Lins', 'mm', 'Rörelse', 'Beskrivning', ''].map((h, i) => (
                      <th key={i} scope="col" className="micro px-2.5 text-accent first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shots.map((s, i) => {
                    const lens = availableLenses.find((l) => l.id === s.lensId);
                    const zoom = lens ? isZoomLens(lens) : false;
                    const focal = lens ? s.focalMm ?? lens.focalMin : null;
                    const code = `${sceneNo}${shotLetter(i)}`;
                    return (
                      <tr key={s.id} className={`h-14 border-b border-line/60 odd:bg-surface/50 hover:bg-raised ${s.done ? 'text-muted' : ''}`}>
                        <td className="w-14 pl-5 font-mono text-[0.8rem] font-bold text-accent">{code}</td>
                        <td className="w-12 px-2.5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-accent"
                            checked={s.done}
                            aria-label={`Tagning ${code} klar`}
                            onChange={(e) => update(s.id, { done: e.target.checked })}
                          />
                        </td>
                        <td className="w-[124px] px-2.5">
                          <ShotTypePicker
                            value={s.type}
                            label={`Bildutsnitt ${code}`}
                            onChange={(type) => update(s.id, { type })}
                          />
                        </td>
                        <td className="w-[136px] px-2.5">
                          <select
                            className="field h-9 font-mono text-[11.5px]"
                            aria-label={`Lins ${code}`}
                            value={s.lensId ?? ''}
                            onChange={(e) => {
                              const newLens = availableLenses.find((l) => l.id === e.target.value);
                              update(s.id, { lensId: e.target.value || null, focalMm: newLens ? newLens.focalMin : null });
                            }}
                          >
                            <option value="">— Ej vald —</option>
                            {availableLenses.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="w-24 px-2.5">
                          {lens && zoom ? (
                            <input
                              type="number"
                              min={lens.focalMin}
                              max={lens.focalMax}
                              step={1}
                              className="field h-9 w-full font-mono text-[12.5px]"
                              aria-label={`Brännvidd ${code} (${lens.focalMin}–${lens.focalMax} mm)`}
                              title={`Zoomobjektiv, ${lens.focalMin}–${lens.focalMax} mm`}
                              value={focal ?? lens.focalMin}
                              onChange={(e) => update(s.id, { focalMm: clampFocal(Number(e.target.value) || lens.focalMin, lens) })}
                            />
                          ) : (
                            <span className="flex h-9 items-center justify-center font-mono text-[12.5px] text-muted" title={lens ? 'Fast objektiv (prime)' : undefined}>
                              {lens ? lens.focalMin : '—'}
                            </span>
                          )}
                        </td>
                        <td className="w-[128px] px-2.5">
                          <select
                            className="field h-9 text-[12.5px]"
                            aria-label={`Kamerarörelse ${code}`}
                            value={s.movement}
                            onChange={(e) => update(s.id, { movement: e.target.value })}
                          >
                            {MOVEMENTS.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5">
                          <input
                            id={`shot-desc-${s.id}`}
                            className="field h-9 text-[13px]"
                            placeholder="Vad ser vi?"
                            aria-label={`Beskrivning ${code}`}
                            value={s.description}
                            onChange={(e) => update(s.id, { description: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && i === shots.length - 1) {
                                e.preventDefault();
                                dispatch({ type: 'ADD_SHOT', sceneId });
                              }
                            }}
                          />
                        </td>
                        <td className="w-[116px] pr-4">
                          <span className="flex justify-end">
                            <button
                              type="button"
                              className={iconBtn}
                              aria-label={`Flytta ${code} upp`}
                              disabled={i === 0}
                              onClick={() => dispatch({ type: 'MOVE_SHOT', sceneId, id: s.id, dir: -1 })}
                            >
                              <Icon name="arrowUp" size={13} />
                            </button>
                            <button
                              type="button"
                              className={iconBtn}
                              aria-label={`Flytta ${code} ner`}
                              disabled={i === shots.length - 1}
                              onClick={() => dispatch({ type: 'MOVE_SHOT', sceneId, id: s.id, dir: 1 })}
                            >
                              <Icon name="arrowDown" size={13} />
                            </button>
                            <button
                              type="button"
                              className={`${iconBtn} hover:text-flare`}
                              aria-label={`Ta bort ${code}`}
                              onClick={() => dispatch({ type: 'DELETE_SHOT', sceneId, id: s.id })}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {shots.length > 0 && (
            <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted">
              Enter i sista beskrivningen lägger till nästa tagning
            </p>
          )}
        </div>

        <footer className="flex h-14 shrink-0 items-center gap-6 border-t border-line bg-surface px-8 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
          <span>
            Scen <span className="text-text">{shots.length}</span> tagningar ·{' '}
            <span className="text-text">{formatDuration(totalDuration(shots))}</span> ·{' '}
            <span className="text-text">
              {doneCount}/{shots.length}
            </span>{' '}
            klara
          </span>
          {shots.length > 0 && doneCount === shots.length && <Chip tone="accentOutline">Scenen inspelad</Chip>}
          <span className="ml-auto">
            Projekt <span className="text-text">{allShots.length}</span> tagningar i <span className="text-text">{scenesWithShots}</span> scener ·{' '}
            <span className="text-text">{formatDuration(totalDuration(allShots))}</span>
          </span>
        </footer>
      </section>

      <AiPlaceholderPanel sceneId={sceneId} onInsert={onInsert} />
    </div>
  );
}
