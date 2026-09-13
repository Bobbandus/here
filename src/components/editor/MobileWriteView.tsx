import { useMemo, useRef, useState } from 'react';
import { useApp } from '../../state/AppState';
import { classifyLines, LINE_TYPE_LABEL, formatEighths } from '../../fountain/parse';
import { shiftOverrides } from './editing';
import { Icon } from '../ui/Icon';

const MIRROR_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'boxSizing',
  'width',
] as const;

/**
 * Textareor har ingen "skrolla till tecken X"-API, och rader radbryts olika mycket
 * beroende på textlängd — ett rad-till-pixel-antagande (rader × radhöjd) blir fel så
 * fort en åtgärdsrad är längre än en skärmbredd. Spegla texten fram till offset i en
 * dold, identiskt stylad div och mät dess höjd istället — det ger exakt skrollposition
 * oavsett radbrytning, samma teknik som "textarea caret position"-bibliotek använder.
 */
function measureOffsetTop(ta: HTMLTextAreaElement, offset: number): number {
  const style = window.getComputedStyle(ta);
  const mirror = document.createElement('div');
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.height = 'auto';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  for (const p of MIRROR_PROPS) mirror.style[p] = style[p];
  mirror.textContent = ta.value.slice(0, offset);
  document.body.appendChild(mirror);
  const top = mirror.offsetHeight;
  document.body.removeChild(mirror);
  return top;
}

/**
 * Mobil skrivvy — inte en förminskad desktop-editor. Ingen fast pixel-sida, ingen
 * overlay-markör: en vanlig <textarea> som webbläsaren själv radbryter och skrollar,
 * precis som i en vanlig anteckningsapp. Det offrar den formaterade WYSIWYG-sidan
 * (desktop, `ScriptEditor`), men är garanterat läsbar och korrekt på vilken telefon
 * som helst — ingen risk för överlappande text.
 */
export function MobileWriteView() {
  const { state, derived, dispatch } = useApp();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const lines = useMemo(() => classifyLines(state.script, { overrides: state.overrides }), [state.script, state.overrides]);

  const currentLineIndex = useMemo(() => state.script.slice(0, caret).split('\n').length - 1, [state.script, caret]);
  const currentType = lines[currentLineIndex]?.type ?? 'action';

  const currentScene = useMemo(() => {
    let best = null as (typeof derived.scenes)[number] | null;
    for (const s of derived.scenes) {
      if (s.headingLine !== null && s.headingLine <= currentLineIndex) best = s;
    }
    return best;
  }, [derived.scenes, currentLineIndex]);

  const onChange = (value: string) => {
    const nextOverrides = shiftOverrides(state.overrides, state.script, value);
    dispatch({ type: 'EDIT', script: value, overrides: nextOverrides, sceneId: currentScene?.scene_id ?? null });
  };

  const syncCaret = (e: { currentTarget: HTMLTextAreaElement }) => setCaret(e.currentTarget.selectionStart);

  const jumpToScene = (sceneId: string) => {
    const scene = derived.scenes.find((s) => s.scene_id === sceneId);
    const ta = taRef.current;
    if (!scene || scene.headingLine === null || !ta) return;
    const line = derived.lines[scene.headingLine];
    if (!line) return;
    setPickerOpen(false);
    ta.focus();
    ta.setSelectionRange(line.offset, line.offset);
    setCaret(line.offset);
    const top = measureOffsetTop(ta, line.offset);
    ta.scrollTop = Math.max(0, top - 24);
  };

  return (
    <div className="relative flex h-full flex-col bg-ink">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_APP', app: 'home' })}
          aria-label="Till startsidan"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-muted hover:bg-raised hover:text-text"
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          aria-expanded={pickerOpen}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-btn border border-line px-3 text-left"
        >
          <span className="shrink-0 font-mono text-[0.68rem] text-accent">{currentScene?.scene_id ?? '—'}</span>
          <span className="min-w-0 flex-1 truncate text-[12.5px]">{currentScene?.scene_heading ?? 'Välj scen'}</span>
          <Icon name={pickerOpen ? 'chevronLeft' : 'chevronRight'} size={12} className="shrink-0 rotate-90" />
        </button>
        <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.06em] text-accent">
          {LINE_TYPE_LABEL[currentType]}
        </span>
      </div>

      {pickerOpen && (
        <div className="absolute inset-x-0 top-14 z-20 max-h-[60vh] overflow-y-auto border-b border-line bg-surface shadow-lg">
          {derived.scenes.map((s) => (
            <button
              key={s.scene_id}
              type="button"
              onClick={() => jumpToScene(s.scene_id)}
              className={`flex w-full items-center gap-2 border-b border-line/60 px-4 py-3 text-left ${
                s.scene_id === currentScene?.scene_id ? 'bg-raised' : 'hover:bg-raised/60'
              }`}
            >
              <span className="shrink-0 font-mono text-[0.68rem] text-accent">{s.scene_id}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{s.scene_heading}</span>
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        className="min-h-0 flex-1 resize-none bg-paper px-5 py-6 font-script text-[15px] leading-[26px] text-[#181818] outline-none"
        value={state.script}
        onChange={(e) => onChange(e.target.value)}
        onSelect={syncCaret}
        onKeyUp={syncCaret}
        onClick={syncCaret}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Manus"
      />

      <div className="flex h-9 shrink-0 items-center justify-center gap-3 border-t border-line bg-surface px-3 font-mono text-[0.62rem] uppercase tracking-[0.06em] text-muted">
        <span>{derived.scenes.length} SCENER</span>
        <span aria-hidden="true">·</span>
        <span>{formatEighths(derived.totalPages)} SID</span>
        <span aria-hidden="true">·</span>
        <span>~{derived.runtimeMin} MIN</span>
      </div>
    </div>
  );
}
