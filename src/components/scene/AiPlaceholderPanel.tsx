import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import { mockAiOutput } from '../../data/mockAiOutput';
import type { AiKind, CreativeAiOutput, CreativeItem, MeasureAiOutput, MeasureRow } from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { Tabs } from '../ui/Tabs';

const TITLES: Record<AiKind, string> = {
  synopsis: 'Generera synopsis',
  lens: 'Föreslå lins',
  shotlist: 'Generera shotlist',
  blocking: 'Föreslå blockning',
  audio: 'Föreslå mikrofonplacering',
  review: 'Granska material',
};

interface AiPlaceholderPanelProps {
  sceneId: string;
  /** INFOGA för kreativ output. Utan callback loggas raden bara till konsolen. */
  onInsert?: (kind: AiKind, item: CreativeItem) => void;
}

/**
 * Glidpanel för AI-platshållare. Visar ENDAST hårdkodad data från data/mockAiOutput.ts.
 * Framtida integration: se README, avsnittet "Var AI-integrationen ska kopplas in senare".
 */
export function AiPlaceholderPanel({ sceneId, onInsert }: AiPlaceholderPanelProps) {
  const { state, dispatch } = useApp();
  const kind = state.ai;
  const [shown, setShown] = useState<AiKind | null>(kind);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // `inert` saknas i React 18-typerna; sätts direkt på DOM-noden.
  useEffect(() => {
    panelRef.current?.toggleAttribute('inert', !kind);
  }, [kind]);

  useEffect(() => {
    if (kind) {
      setShown(kind);
      requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    }
  }, [kind]);

  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !state.paletteOpen) dispatch({ type: 'CLOSE_AI' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, dispatch, state.paletteOpen]);

  const output = shown ? mockAiOutput[shown] : null;

  return (
    <aside
      ref={panelRef}
      id="ai-panel"
      role="dialog"
      aria-label={shown ? `${TITLES[shown]} (platshållare)` : 'AI-panel'}
      aria-hidden={!kind}
      className={`absolute inset-y-0 right-0 z-30 flex w-[440px] flex-col border-l border-line bg-surface shadow-[-24px_0_48px_rgba(0,0,0,0.45)] transition-transform duration-250 ease-out ${
        kind ? 'translate-x-0' : 'pointer-events-none translate-x-full'
      }`}
    >
      {shown && output && (
        <>
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-5 pr-3">
            <MonoLabel as="h2">{TITLES[shown]}</MonoLabel>
            <button
              ref={closeRef}
              type="button"
              aria-label="Stäng panel"
              onClick={() => dispatch({ type: 'CLOSE_AI' })}
              className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
            >
              <Icon name="close" size={14} />
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            <Chip tone="gold" className="self-start">
              Platshållare · Exempeldata · Ingen AI kopplad
            </Chip>
            {output.kind === 'creative' ? (
              <CreativeBody key={shown} output={output} onInsert={onInsert} />
            ) : (
              <MeasureBody key={shown} output={output} />
            )}
          </div>

          <p className="shrink-0 border-t border-line px-5 py-3 text-[0.7rem] text-muted">
            Underlag: {sceneId} · karaktärer · story bible · produktionsdata
          </p>
        </>
      )}
    </aside>
  );
}

function CreativeBody({ output, onInsert }: { output: CreativeAiOutput; onInsert?: (kind: AiKind, item: CreativeItem) => void }) {
  const [tab, setTab] = useState(output.variants[0]?.label ?? '');
  const variant = output.variants.find((v) => v.label === tab) ?? output.variants[0];

  return (
    <div className="flex flex-col gap-4">
      <Chip tone="goldOutline" className="self-start">
        Förslag · Utgångspunkt
      </Chip>
      <Tabs
        label="Varianter"
        idPrefix={`variant-${output.id}`}
        items={output.variants.map((v) => ({ id: v.label, label: v.label }))}
        value={tab}
        onChange={setTab}
      />
      {variant && (
        <ol role="tabpanel" aria-labelledby={`variant-${output.id}-${variant.label}`} className="flex flex-col">
          {variant.items.map((item, i) => (
            <li key={i} className="flex gap-3 border-b border-line py-3.5 last:border-b-0">
              <span className="w-5 shrink-0 font-mono text-[0.72rem] text-muted">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-[13.5px] leading-relaxed">{item.text}</span>
                <span className="font-mono text-[0.66rem] text-muted">{item.meta}</span>
              </div>
              <Button
                variant="quiet"
                className="self-start"
                aria-label={`Infoga rad ${i + 1}`}
                onClick={() =>
                  onInsert ? onInsert(output.id, item) : console.log('[A+] INFOGA (platshållare)', output.id, variant.label, item)
                }
              >
                Infoga
              </Button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function MeasureBody({ output }: { output: MeasureAiOutput }) {
  const hasModes = output.cleanRows !== undefined;
  const [mode, setMode] = useState<'deviations' | 'clean'>('deviations');
  const rows: MeasureRow[] = hasModes && mode === 'clean' ? output.cleanRows ?? [] : output.rows;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Chip tone="accentOutline">Mätvärden</Chip>
        {hasModes && (
          <div role="group" aria-label="Mock-läge" className="flex rounded-btn border border-line p-0.5">
            {(
              [
                ['deviations', 'Med avvikelser'],
                ['clean', 'Inga avvikelser'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={`h-7 rounded-[2px] px-2.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
                  mode === id ? 'bg-raised text-text' : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-media border border-line">
          <span className="font-mono text-[0.74rem] tracking-[0.08em] text-muted">INGA MÄTBARA AVVIKELSER</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-media border border-line">
          <table className="w-full border-collapse font-mono text-[0.68rem]">
            <thead>
              <tr className="border-b border-line bg-raised text-left">
                {['Parameter', 'Uppmätt', 'Tröskel', 'Avvikelse'].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.parameter} className="border-b border-line/60 align-top last:border-b-0">
                  <td className="px-3 py-2 text-text">{r.parameter}</td>
                  <td className={`px-3 py-2 ${r.deviation ? 'text-flare' : 'text-text'}`}>{r.measured}</td>
                  <td className="px-3 py-2 text-muted">{r.threshold}</td>
                  <td className={`px-3 py-2 ${r.deviation ? 'font-bold text-flare' : 'text-muted'}`}>{r.deviation ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
