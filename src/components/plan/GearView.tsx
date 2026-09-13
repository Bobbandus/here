import { useMemo, useState } from 'react';
import { useApp } from '../../state/AppState';
import { isZoomLens, parseFocalRange } from '../../data/production';
import type { GearCategory, GearItem, GearStatus } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { Popover } from '../ui/Popover';

const CATEGORIES: GearCategory[] = ['Kamera', 'Objektiv', 'Ljud', 'Ljus', 'Grip', 'Övrigt'];
const STATUSES: GearStatus[] = ['Tillgänglig', 'Utlånad', 'Service'];

const statusClass: Record<GearStatus, string> = {
  Tillgänglig: 'border-accent/60 text-accent',
  Utlånad: 'border-gold/60 text-gold',
  Service: 'border-flare/60 text-flare',
};

type Filter = 'all' | GearStatus;

/** Läsbar sammanfattning av objektivets brännvidd, t.ex. "12–42 mm" eller "50 mm". */
function focalSummary(g: GearItem): string {
  if (typeof g.focalMin !== 'number' || typeof g.focalMax !== 'number') return '—';
  return isZoomLens({ focalMin: g.focalMin, focalMax: g.focalMax }) ? `${g.focalMin}–${g.focalMax} mm` : `${g.focalMin} mm`;
}

interface LensEditorProps {
  gear: GearItem;
  onChange: (patch: Partial<Omit<GearItem, 'id'>>) => void;
}

/**
 * Innehållet i objektivets redigeringsmeny. Brännvidden tolkas fritt: "50" blir ett
 * fast objektiv, "12-42" (eller med tankstreck) blir ett zoomintervall — se
 * `parseFocalRange`. Ändringar skrivs direkt när texten går att tolka.
 */
function LensEditor({ gear, onChange }: LensEditorProps) {
  const initial = typeof gear.focalMin === 'number' && typeof gear.focalMax === 'number' ? focalSummary(gear).replace(' mm', '').replace('–', '-') : '';
  const [focalText, setFocalText] = useState(initial);
  const parsed = parseFocalRange(focalText);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="micro mb-1.5 block text-muted" htmlFor={`lens-focal-${gear.id}`}>
          Brännvidd
        </label>
        <input
          id={`lens-focal-${gear.id}`}
          className="field h-9 font-mono text-[12.5px]"
          placeholder="T.ex. 50 eller 12-42"
          value={focalText}
          onChange={(e) => {
            const v = e.target.value;
            setFocalText(v);
            const p = parseFocalRange(v);
            if (p) onChange({ focalMin: p.focalMin, focalMax: p.focalMax });
          }}
          autoFocus
        />
        <p className={`mt-1.5 font-mono text-[0.68rem] ${parsed ? 'text-accent' : focalText.trim() ? 'text-flare' : 'text-muted'}`}>
          {parsed
            ? parsed.focalMin === parsed.focalMax
              ? `Fast objektiv · ${parsed.focalMin} mm`
              : `Zoomobjektiv · ${parsed.focalMin}–${parsed.focalMax} mm`
            : focalText.trim()
              ? 'Kan inte tolkas — skriv t.ex. 50 eller 12-42'
              : 'Skriv ett tal (fast) eller två med bindestreck (zoom)'}
        </p>
      </div>
      <div>
        <label className="micro mb-1.5 block text-muted" htmlFor={`lens-aperture-${gear.id}`}>
          Bländare
        </label>
        <input
          id={`lens-aperture-${gear.id}`}
          className="field h-9 font-mono text-[12.5px]"
          placeholder="f/1.8"
          value={gear.aperture ?? ''}
          onChange={(e) => onChange({ aperture: e.target.value })}
        />
      </div>
    </div>
  );
}

export function GearView() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: string; anchor: HTMLElement } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    return state.gear.filter((g) => {
      if (filter !== 'all' && g.status !== filter) return false;
      if (!q) return true;
      return `${g.name} ${g.location} ${g.assignedTo} ${g.category}`.toUpperCase().includes(q);
    });
  }, [state.gear, filter, query]);

  const counts = useMemo(() => {
    const c: Record<GearStatus, number> = { Tillgänglig: 0, Utlånad: 0, Service: 0 };
    for (const g of state.gear) c[g.status]++;
    return c;
  }, [state.gear]);

  const update = (id: string, patch: Partial<Omit<GearItem, 'id'>>) => dispatch({ type: 'UPDATE_GEAR', id, patch });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <MonoLabel eyebrow>Utrustning</MonoLabel>
            <h2 className="mt-2.5 font-black text-[2rem] leading-[1.02] tracking-[-0.03em]">Gear-lista</h2>
            <p className="mt-2.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted">
              <span className="text-text">{state.gear.length}</span> objekt · <span className="text-accent">{counts.Tillgänglig}</span> tillgängliga ·{' '}
              <span className="text-gold">{counts.Utlånad}</span> utlånade ·{' '}
              <span className={counts.Service ? 'text-flare' : 'text-text'}>{counts.Service}</span> på service
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => dispatch({ type: 'ADD_GEAR' })}>
            <Icon name="plus" size={12} />
            Ny utrustning
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filtrera på status" className="flex gap-1 rounded-btn border border-line p-1">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`h-9 rounded-btn px-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
                filter === 'all' ? 'bg-raised text-accent' : 'text-muted hover:text-text'
              }`}
            >
              Alla
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
                className={`h-9 rounded-btn px-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
                  filter === s ? 'bg-raised text-accent' : 'text-muted hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="field h-9 w-64 font-mono text-[0.72rem]"
            placeholder="SÖK NAMN, PLATS ELLER LÅNTAGARE"
            aria-label="Sök utrustning"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-auto rounded-panel border border-line">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface">
              <tr className="h-11 border-b border-line">
                {['Namn', 'Kategori', 'Brännvidd', 'Plats', 'Status', 'Tilldelad', 'Anteckningar', ''].map((h, i) => (
                  <th key={i} scope="col" className="micro px-2.5 text-accent first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const isLens = g.category === 'Objektiv';
                return (
                  <tr key={g.id} className="h-14 border-b border-line/60 odd:bg-surface/50 hover:bg-raised">
                    <td className="w-[190px] pl-5 pr-2.5">
                      <input
                        className="field h-9 text-[12.5px]"
                        value={g.name}
                        aria-label="Namn"
                        onChange={(e) => update(g.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="w-[120px] px-2.5">
                      <select
                        className="field h-9 text-[12px]"
                        value={g.category}
                        aria-label="Kategori"
                        onChange={(e) => update(g.id, { category: e.target.value as GearCategory })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="w-[140px] px-2.5">
                      {isLens ? (
                        <span className="flex h-9 items-center font-mono text-[12px] text-text">
                          {focalSummary(g)}
                          {g.aperture ? <span className="ml-1.5 text-muted">· {g.aperture}</span> : null}
                        </span>
                      ) : (
                        <span className="flex h-9 items-center justify-center font-mono text-[12px] text-muted">—</span>
                      )}
                    </td>
                    <td className="w-[170px] px-2.5">
                      <input
                        className="field h-9 text-[12.5px]"
                        placeholder="T.ex. Studion, hylla 3"
                        value={g.location}
                        aria-label="Förvaringsplats"
                        onChange={(e) => update(g.id, { location: e.target.value })}
                      />
                    </td>
                    <td className="w-[140px] px-2.5">
                      <select
                        className={`field h-9 text-[12px] ${statusClass[g.status]}`}
                        value={g.status}
                        aria-label="Status"
                        onChange={(e) => update(g.id, { status: e.target.value as GearStatus })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} className="text-text">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="w-[140px] px-2.5">
                      <input
                        className="field h-9 text-[12.5px]"
                        placeholder="Namn / scen"
                        value={g.assignedTo}
                        aria-label="Tilldelad"
                        onChange={(e) => update(g.id, { assignedTo: e.target.value })}
                      />
                    </td>
                    <td className="px-2.5">
                      <input
                        className="field h-9 text-[12.5px]"
                        value={g.notes}
                        aria-label="Anteckningar"
                        onChange={(e) => update(g.id, { notes: e.target.value })}
                      />
                    </td>
                    <td className="w-24 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isLens && (
                          <button
                            type="button"
                            aria-label={`Redigera objektiv ${g.name}`}
                            onClick={(e) => setEditing({ id: g.id, anchor: e.currentTarget })}
                            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-accent"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Ta bort ${g.name}`}
                          onClick={() => {
                            if (editing?.id === g.id) setEditing(null);
                            dispatch({ type: 'DELETE_GEAR', id: g.id });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-flare"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center font-mono text-[0.74rem] text-muted">
                    {state.gear.length === 0 ? 'INGEN UTRUSTNING TILLAGD ÄNNU' : 'INGA TRÄFFAR'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[0.7rem] text-muted">
          Klicka på pennan vid ett objektiv för att ange brännvidd — skriv ett tal för ett fast objektiv (prime) eller
          två med bindestreck (t.ex. 12-42) för ett zoomintervall. Shotlistan och scenens kameraval läser objektiv
          härifrån.
        </p>
      </div>
      {editing &&
        (() => {
          const editingGear = state.gear.find((g) => g.id === editing.id);
          if (!editingGear) return null;
          return (
            <Popover anchorEl={editing.anchor} onClose={() => setEditing(null)} label={`Redigera objektiv ${editingGear.name}`}>
              <LensEditor gear={editingGear} onChange={(patch) => update(editingGear.id, patch)} />
            </Popover>
          );
        })()}
    </div>
  );
}
