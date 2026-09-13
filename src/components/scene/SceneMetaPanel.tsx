import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../../state/AppState';
import type { AppScene, SceneMeta } from '../../types';
import { formatEighths } from '../../fountain/parse';
import {
  audioChannels,
  cast,
  horizontalAngle,
  micPlacements,
  microphones,
  props as propInventory,
  SENSOR_WIDTH_MM,
  sensorFormats,
} from '../../data/production';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { Panel } from '../ui/Panel';
import { StageChip, STAGES } from '../pipeline/StageChip';
import { AiActionButton } from './AiActionButton';
import { formatDuration, lensGear, shotLetter, totalDuration } from '../plan/shots';

function sensorWidth(label: string): number {
  const m = label.match(/([\d.]+)\s*mm/u);
  return m ? Number(m[1]) : SENSOR_WIDTH_MM;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-4 py-2.5">
      <MonoLabel tone="muted">{label}</MonoLabel>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Staplade metadatapaneler för en scen. */
export function SceneMetaPanel({ scene }: { scene: AppScene }) {
  const { state, dispatch, derived, goToScene } = useApp();
  const id = scene.scene_id;
  const shots = state.shots[id] ?? [];
  const sceneNo = derived.scenes.findIndex((s) => s.scene_id === id) + 1;
  const prod = state.sceneMeta[id]?.production ?? scene.production;
  const sensor = state.sceneMeta[id]?.production.sensor ?? sensorFormats[0];
  const micPlacement = state.sceneMeta[id]?.production.mic_placement ?? micPlacements[0];
  const channel = state.sceneMeta[id]?.production.channel ?? audioChannels[0];
  const update = (patch: Partial<SceneMeta['production']>) =>
    dispatch({ type: 'UPDATE_PRODUCTION', sceneId: id, patch });
  const [newProp, setNewProp] = useState('');
  const availableLenses = useMemo(() => lensGear(state.gear), [state.gear]);

  const lens = availableLenses.find((l) => l.id === prod.lens_id) ?? null;
  const width = sensorWidth(sensor);
  const angle = lens
    ? lens.focalMin === lens.focalMax
      ? `${horizontalAngle(lens.focalMin, width).toFixed(1)}°`
      : `${horizontalAngle(lens.focalMin, width).toFixed(1)}° – ${horizontalAngle(lens.focalMax, width).toFixed(1)}°`
    : null;

  const copyId = () => {
    void navigator.clipboard?.writeText(id).catch(() => undefined);
    dispatch({ type: 'TOAST', message: `${id} kopierat` });
  };

  const addProp = () => {
    const name = newProp.trim();
    if (!name || prod.props.includes(name)) return;
    update({ props: [...prod.props, name] });
    setNewProp('');
  };

  const castOf = (name: string) => prod.cast[name] ?? '';

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Identitet */}
      <Panel title="Identitet" id="p-identity" actions={<AiActionButton kind="synopsis" label="Generera synopsis" />}>
        <Row label="Scen-ID">
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-[0.9rem] text-accent">{id}</span>
            <button
              type="button"
              aria-label={`Kopiera scen-ID ${id}`}
              onClick={copyId}
              className="flex h-6 w-6 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
            >
              <Icon name="copy" size={13} />
            </button>
          </span>
        </Row>
        <Row label="Rubrik">
          <span className="font-display font-bold">{scene.scene_heading}</span>
        </Row>
        <Row label="Int / Ext">
          {scene.int_ext ? <Chip tone="accentOutline">{scene.int_ext}</Chip> : <Chip tone="muted">Tvingad</Chip>}
        </Row>
        <Row label="Plats">{scene.location || '—'}</Row>
        <Row label="Tid på dygnet">{scene.time_of_day ?? '—'}</Row>
        <Row label="Längd">
          <span className="font-mono">{formatEighths(scene.page_length)} s</span>
          <span className="ml-2 font-mono text-[0.68rem] text-muted">
            {scene.hasText ? `${scene.action_lines.length} ACTION · ${scene.dialogue.length} REPLIKER` : 'METADATA'}
          </span>
        </Row>
      </Panel>

      {/* 2. Karaktärer & cast */}
      <Panel title="Karaktärer & cast" id="p-cast" bodyClassName="px-5 py-3">
        {scene.characters_present.length === 0 && (
          <p className="py-3 font-mono text-[0.72rem] text-muted">INGA KARAKTÄRER I SCENEN</p>
        )}
        <ul>
          {scene.characters_present.map((name) => {
            const ch = state.characters.find((c) => c.name === name);
            const castId = castOf(name);
            const chosenCandidates = state.project.casting[name]?.candidates.filter((c) => c.chosen) ?? [];
            return (
              <li key={name} className="grid grid-cols-[1fr_190px_72px] items-center gap-3 border-b border-line/60 py-3 last:border-b-0">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: ch?.color ?? '#9a9aa0' }} />
                  <span className="font-display font-bold">{name}</span>
                </span>
                <select
                  className="field h-9 text-[12.5px]"
                  aria-label={`Skådespelare för ${name}`}
                  value={castId}
                  onChange={(e) => update({ cast: { ...prod.cast, [name]: e.target.value } })}
                >
                  <option value="">— Välj —</option>
                  {chosenCandidates.length > 0 && (
                    <optgroup label="Vald i casting">
                      {chosenCandidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Castinventarie">
                    {cast.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="flex justify-end">
                  {castId ? <Chip tone="accentOutline">Satt</Chip> : <Chip tone="flare">Ej satt</Chip>}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* 3. Rekvisita */}
      <Panel title="Rekvisita" id="p-props">
        <ul className="flex flex-wrap gap-2.5">
          {prod.props.length === 0 && <li className="font-mono text-[0.72rem] text-muted">INGEN REKVISITA</li>}
          {prod.props.map((p) => {
            const item = propInventory.find((x) => x.name === p);
            return (
              <li
                key={p}
                className="inline-flex items-center gap-2.5 rounded-full border border-line bg-raised py-1.5 pl-4 pr-1.5 text-[12.5px]"
              >
                <span>{p}</span>
                <span className="font-mono text-[0.6rem] tracking-[0.08em] text-muted">
                  {item ? `${item.source} · ${item.method}` : 'EJ KÄLLSATT'}
                </span>
                <button
                  type="button"
                  aria-label={`Ta bort ${p}`}
                  onClick={() => update({ props: prod.props.filter((x) => x !== p) })}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-line hover:text-flare"
                >
                  <Icon name="close" size={10} />
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-4 flex gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            addProp();
          }}
        >
          <input
            className="field font-mono text-[12.5px]"
            list="prop-inventory"
            placeholder="LÄGG TILL REKVISITA"
            aria-label="Lägg till rekvisita"
            value={newProp}
            onChange={(e) => setNewProp(e.target.value)}
          />
          <datalist id="prop-inventory">
            {propInventory.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          <Button type="submit" variant="ghost" className="h-10 shrink-0" aria-label="Lägg till">
            <Icon name="plus" size={12} />
          </Button>
        </form>
      </Panel>

      {/* 4. Kamera & optik */}
      <Panel title="Kamera & optik" id="p-camera" actions={<AiActionButton kind="lens" label="Föreslå lins" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Lins" hint={lens?.mount}>
            {(fid) => (
              <select id={fid} className="field" value={prod.lens_id ?? ''} onChange={(e) => update({ lens_id: e.target.value || null })}>
                <option value="">— Ej vald —</option>
                {availableLenses.length === 0 && (
                  <option value="" disabled>
                    Inga objektiv i Utrustning ännu
                  </option>
                )}
                {availableLenses.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.mount ? ` · ${l.mount}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Sensorformat">
            {(fid) => (
              <select id={fid} className="field" value={sensor} onChange={(e) => update({ sensor: e.target.value })}>
                {sensorFormats.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 rounded-media border border-line bg-raised px-4 py-3.5">
          <div className="flex flex-col gap-1.5">
            <MonoLabel tone="muted">Bildvinkel H</MonoLabel>
            {angle ? <span className="font-mono text-[1rem] text-text">{angle}</span> : <Chip tone="flare" className="self-start">Ej vald</Chip>}
          </div>
          <div className="flex flex-col gap-1.5">
            <MonoLabel tone="muted">Sensorbredd</MonoLabel>
            <span className="font-mono text-[1rem]">{width.toFixed(2)} mm</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <MonoLabel tone="muted">Bländare</MonoLabel>
            <span className="font-mono text-[1rem]">{lens?.aperture ?? '—'}</span>
          </div>
        </div>
        <p className="mt-3 font-mono text-[0.62rem] text-muted">2 · atan(sensorbredd / (2 · f)) · beräknas lokalt</p>
      </Panel>

      {/* Tagningar */}
      <Panel title="Tagningar" id="p-shots" actions={<AiActionButton kind="shotlist" label="Generera shotlist" />}>
        {shots.length === 0 ? (
          <p className="font-mono text-[0.72rem] text-muted">INGEN SHOTLISTA FÖR {id}</p>
        ) : (
          <ul className="flex flex-col gap-2 font-mono text-[0.72rem]">
            {shots.slice(0, 5).map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="w-10 text-accent">
                  {sceneNo}
                  {shotLetter(i)}
                </span>
                <span className="w-14 text-text">{s.type}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{s.description || '—'}</span>
                <span className="text-muted">{formatDuration(s.durationSec)}</span>
              </li>
            ))}
            {shots.length > 5 && <li className="text-muted">+{shots.length - 5} TILL</li>}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[0.66rem] text-muted">
            {shots.length} TAGNINGAR · {formatDuration(totalDuration(shots))}
          </span>
          <Button variant="ghost" onClick={() => goToScene(id, 'shots')}>
            Öppna shotlista →
          </Button>
        </div>
      </Panel>

      {/* Regi */}
      <Panel title="Regi" id="p-direction" actions={<AiActionButton kind="blocking" label="Föreslå blockning" />}>
        <Field label="Regianteckningar">
          {(fid) => (
            <textarea
              id={fid}
              rows={3}
              className="field h-auto resize-y py-2 leading-relaxed"
              value={prod.notes}
              placeholder="Blockning, ton, rörelse…"
              onChange={(e) => update({ notes: e.target.value })}
            />
          )}
        </Field>
      </Panel>

      {/* 5. Ljud */}
      <Panel title="Ljud" id="p-audio" actions={<AiActionButton kind="audio" label="Föreslå mikrofonplacering" />}>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Mikrofon">
            {(fid) => (
              <select id={fid} className="field" value={prod.mic_id ?? ''} onChange={(e) => update({ mic_id: e.target.value || null })}>
                <option value="">— Ej vald —</option>
                {microphones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Placering">
            {(fid) => (
              <select id={fid} className="field" value={micPlacement} onChange={(e) => update({ mic_placement: e.target.value })}>
                {micPlacements.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Kanal">
            {(fid) => (
              <select id={fid} className="field font-mono" value={channel} onChange={(e) => update({ channel: e.target.value })}>
                {audioChannels.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
        {prod.mic_id && (
          <p className="mt-3 font-mono text-[0.66rem] text-muted">
            {prod.mic_id} · {microphones.find((m) => m.id === prod.mic_id)?.type}
          </p>
        )}
      </Panel>

      {/* Efterproduktion */}
      <Panel title="Efterproduktion" id="p-post" actions={<AiActionButton kind="review" label="Granska material" />}>
        <dl className="grid grid-cols-3 gap-4 font-mono text-[0.72rem]">
          <div>
            <dt className="micro text-muted">Klipp</dt>
            <dd className="mt-1.5">{scene.pipeline.post === 'todo' ? '—' : 'V2 · 00:02:14:08'}</dd>
          </div>
          <div>
            <dt className="micro text-muted">Ingest</dt>
            <dd className="mt-1.5">{scene.pipeline.production === 'done' ? '3 KORT' : '—'}</dd>
          </div>
          <div>
            <dt className="micro text-muted">Tagningar</dt>
            <dd className="mt-1.5">{scene.pipeline.production === 'todo' ? '0' : '14'}</dd>
          </div>
        </dl>
      </Panel>

      {/* 6. Pipeline */}
      <Panel title="Pipeline" id="p-pipeline">
        <div className="grid grid-cols-4 gap-3">
          {STAGES.map((s) => (
            <div key={s.id} className="flex flex-col items-start gap-2">
              <MonoLabel tone="muted">{s.label}</MonoLabel>
              <StageChip sceneId={id} stage={s.id} status={scene.pipeline[s.id]} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
