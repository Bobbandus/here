import { useMemo, useRef, useState } from 'react';
import { useApp } from '../state/AppState';
import { formatEighths } from '../fountain/parse';
import { shiftOverrides } from '../components/editor/editing';
import type { ParsedLine } from '../types';
import { Icon } from '../components/ui/Icon';
import { IconButton, MHeader, Sheet, useVisualViewport } from './ui';

interface Block {
  key: string;
  sceneId: string | null;
  label: string;
  heading: string;
  number: number | null;
  start: number;
  end: number;
}

/**
 * Läsbar formatering för smal skärm — relativa indrag (procent/em), aldrig fasta
 * pixlar, så texten alltid radbryts naturligt precis som i Google Docs.
 */
function LineView({ line }: { line: ParsedLine }) {
  const t = line.text;
  switch (line.type) {
    case 'empty':
      return <div className="h-[0.8em]" aria-hidden="true" />;
    case 'scene_heading':
      return <div className="font-bold uppercase tracking-[0.03em]">{t}</div>;
    case 'character':
      return <div className="mt-1 text-center font-bold uppercase">{t}</div>;
    case 'parenthetical':
      return <div className="text-center italic text-[#55554d]">{t}</div>;
    case 'dialogue':
      return <div className="mx-[7%]">{t}</div>;
    case 'transition':
      return <div className="text-right font-bold uppercase">{t}</div>;
    case 'centered':
      return <div className="text-center">{t}</div>;
    case 'section':
      return <div className="font-sans text-[13px] font-bold uppercase tracking-[0.08em] text-[#8a8a80]">{t}</div>;
    case 'synopsis':
      return <div className="italic text-[#6f6f66]">{t}</div>;
    case 'note':
      return <div className="rounded-[4px] bg-[#ffce3f]/25 px-2 py-0.5 text-[14px] text-[#6b5400]">{t}</div>;
    default:
      return <div>{t}</div>;
  }
}

function SceneEditor({ block, onClose }: { block: Block; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const vv = useVisualViewport();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const original = useMemo(() => state.script.split('\n').slice(block.start, block.end + 1).join('\n'), [state.script, block.start, block.end]);
  const [draft, setDraft] = useState(original);
  const dirty = draft !== original;

  const save = () => {
    if (dirty) {
      const all = state.script.split('\n');
      const next = [...all.slice(0, block.start), ...draft.split('\n'), ...all.slice(block.end + 1)].join('\n');
      dispatch({ type: 'EDIT', script: next, overrides: shiftOverrides(state.overrides, state.script, next), sceneId: block.sceneId });
    }
    onClose();
  };

  const cancel = () => {
    if (dirty && !window.confirm('Släng ändringarna i den här scenen?')) return;
    onClose();
  };

  const insert = (snippet: string, onNewLine: boolean) => {
    const ta = taRef.current;
    const pos = ta ? ta.selectionStart : draft.length;
    const endPos = ta ? ta.selectionEnd : draft.length;
    const before = draft.slice(0, pos);
    const prefix = onNewLine && before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const text = prefix + snippet;
    const next = before + text + draft.slice(endPos);
    setDraft(next);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const caret = pos + text.length - (snippet.endsWith(')') ? 1 : 0);
      ta.setSelectionRange(caret, caret);
    });
  };

  const heading = state.headingStyle === 'period' ? 'INT. PLATS. DAG.' : 'INT. PLATS – DAG';

  return (
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-ink"
      style={{ top: vv.top, height: vv.height }}
      role="dialog"
      aria-modal="true"
      aria-label={`Redigera ${block.label}`}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={cancel} className="h-11 rounded-full px-3 text-[16px] text-muted active:bg-raised">
          Avbryt
        </button>
        <div className="min-w-0 flex-1 truncate text-center font-mono text-[12px] uppercase tracking-[0.06em] text-muted">{block.label}</div>
        <button type="button" onClick={save} className="h-11 rounded-full px-4 text-[16px] font-bold text-accent active:bg-raised">
          Klar
        </button>
      </header>
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-line px-3 py-2">
        {[
          { label: 'Scenrubrik', snippet: heading, nl: true },
          { label: 'Karaktär', snippet: 'NAMN\n', nl: true },
          { label: '( )', snippet: '()', nl: true },
          { label: 'Klipp till:', snippet: 'KLIPP TILL:', nl: true },
          { label: 'Anteckning', snippet: '[[]]', nl: false },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(b.snippet, b.nl)}
            className="h-9 shrink-0 rounded-full border border-line bg-surface px-4 font-mono text-[12px] font-bold uppercase tracking-[0.04em] text-text active:bg-raised"
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1 bg-paper">
        <textarea
          ref={taRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          spellCheck
          autoCapitalize="sentences"
          aria-label="Scentext"
          className="absolute inset-0 h-full w-full resize-none bg-paper px-5 py-5 font-script text-[16px] leading-[1.6] text-[#181818] outline-none"
        />
      </div>
    </div>
  );
}

export function ScriptTab() {
  const { state, derived, dispatch } = useApp();
  const [editing, setEditing] = useState<Block | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const totalLines = derived.lines.length;

  const blocks = useMemo<Block[]>(() => {
    const textScenes = derived.scenes.filter((s) => s.hasText && s.headingLine !== null && s.endLine !== null);
    const out: Block[] = [];
    const first = textScenes[0]?.headingLine ?? totalLines;
    if (first > 0 && derived.lines.slice(0, first).some((l) => l.type !== 'empty')) {
      out.push({ key: 'intro', sceneId: null, label: 'Inledning', heading: 'Inledning', number: null, start: 0, end: first - 1 });
    }
    textScenes.forEach((s) => {
      out.push({
        key: s.scene_id,
        sceneId: s.scene_id,
        label: `${s.scene_id} · ${s.scene_heading}`,
        heading: s.scene_heading,
        number: derived.scenes.indexOf(s) + 1,
        start: s.headingLine as number,
        end: s.endLine as number,
      });
    });
    return out;
  }, [derived.scenes, derived.lines, totalLines]);

  const wholeScript: Block = { key: 'all', sceneId: null, label: 'Hela manuset', heading: 'Hela manuset', number: null, start: 0, end: Math.max(0, state.script.split('\n').length - 1) };

  const addScene = () => {
    const heading = state.headingStyle === 'period' ? 'INT. PLATS. DAG.' : 'INT. PLATS – DAG';
    const trimmed = state.script.replace(/\s+$/u, '');
    const next = `${trimmed ? `${trimmed}\n\n` : ''}${heading}\n\n`;
    const lines = next.split('\n');
    dispatch({ type: 'EDIT', script: next, overrides: state.overrides, sceneId: null });
    setEditing({ key: 'new', sceneId: null, label: 'Ny scen', heading, number: null, start: lines.length - 3, end: lines.length - 1 });
  };

  const jumpTo = (key: string) => {
    setJumpOpen(false);
    requestAnimationFrame(() => document.getElementById(`m-block-${key}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  return (
    <div className="flex h-full flex-col">
      <MHeader
        title={state.project.title}
        sub={`${derived.textSceneCount} scener · ${formatEighths(derived.totalPages)} sid · ~${derived.runtimeMin} min`}
        right={<IconButton icon="scene" label="Hoppa till scen" onClick={() => setJumpOpen(true)} />}
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-8 py-20 text-center">
            <p className="text-[16px] text-muted">Manuset är tomt.</p>
            <button type="button" onClick={addScene} className="h-12 rounded-full bg-accent px-6 text-[16px] font-bold text-accentInk">
              Skriv första scenen
            </button>
          </div>
        ) : (
          <div className="bg-paper pb-28 font-script text-[16px] leading-[1.6] text-[#181818]">
            {blocks.map((b) => (
              <section key={b.key} id={`m-block-${b.key}`} className="scroll-mt-2 border-b border-black/10 px-5 pb-6 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(b)}
                  className="-mx-2 mb-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-[8px] px-2 py-1.5 text-left active:bg-black/5"
                >
                  <span className="shrink-0 font-mono text-[11px] font-bold text-[#8a8a80]">{b.number ?? '—'}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8a80]">
                    {b.sceneId ?? b.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-sans text-[12px] font-bold text-[#1f9a61]">
                    <Icon name="edit" size={13} />
                    Redigera
                  </span>
                </button>
                {derived.lines.slice(b.start, b.end + 1).map((l) => (
                  <LineView key={l.lineId} line={l} />
                ))}
              </section>
            ))}
          </div>
        )}

        {blocks.length > 0 && (
          <button
            type="button"
            onClick={addScene}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-10 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-bold text-accentInk shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:scale-95"
          >
            <Icon name="plus" size={16} />
            Scen
          </button>
        )}
      </div>

      <Sheet open={jumpOpen} onClose={() => setJumpOpen(false)} title="Scener">
        <div className="flex flex-col">
          {blocks.map((b) => (
            <button key={b.key} type="button" onClick={() => jumpTo(b.key)} className="flex min-h-12 items-center gap-3 border-b border-line py-3 text-left active:bg-raised">
              <span className="w-8 shrink-0 font-mono text-[12px] text-accent">{b.number ?? '·'}</span>
              <span className="min-w-0 flex-1 text-[15px] leading-snug">{b.heading}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setJumpOpen(false);
              setEditing(wholeScript);
            }}
            className="mt-4 h-12 rounded-[12px] border border-line text-[15px] font-bold text-text active:bg-raised"
          >
            Redigera hela manuset
          </button>
        </div>
      </Sheet>

      {editing && <SceneEditor key={editing.key + editing.start} block={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
