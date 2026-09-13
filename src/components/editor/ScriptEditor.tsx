import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useApp, type Zoom } from '../../state/AppState';
import type { LineType } from '../../types';
import {
  classifyLines,
  HEADING_PREFIX_RE,
  isBlank,
  isCharacterCandidate,
  isHeadingText,
  LINE_TYPE_LABEL,
  stripExtension,
  UPPERCASE_TYPES,
} from '../../fountain/parse';
import { getSuggestions, nextInCycle, type Suggestion } from '../../fountain/autocomplete';
import { anchorOf, focusOf, selFrom, shiftOverrides, upperSafe, wordRangeAt, type Sel } from './editing';
import { HighlightLayer } from './HighlightLayer';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';

const PAGE_WIDTH = 780;
const LINE_H = 24;
const ROWS_PER_PAGE = 55;

const FORCE_KEYS: Record<string, LineType> = {
  '1': 'scene_heading',
  '2': 'action',
  '3': 'character',
  '4': 'dialogue',
  '5': 'transition',
};

const ELEMENT_OPTIONS: LineType[] = ['scene_heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];

interface Snapshot {
  text: string;
  overrides: Record<number, LineType>;
  sel: Sel;
}

interface CaretApi {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
}

function caretFromPoint(x: number, y: number): { node: Node; offset: number } | null {
  const d = document as unknown as CaretApi;
  if (typeof d.caretPositionFromPoint === 'function') {
    const p = d.caretPositionFromPoint(x, y);
    return p ? { node: p.offsetNode, offset: p.offset } : null;
  }
  if (typeof d.caretRangeFromPoint === 'function') {
    const r = d.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  return null;
}

// Lever kvar mellan vybyten (inte persistens).
const savedSels = new Map<string, Sel>();
const ZERO_SEL: Sel = { start: 0, end: 0, backward: false };
let consumedJump = 0;

interface ScriptEditorProps {
  /** Fokusläge: döljer verktygsraden för en lugnare skrivyta. */
  minimal?: boolean;
}

export function ScriptEditor({ minimal = false }: ScriptEditorProps) {
  const { state, dispatch, derived } = useApp();
  const { script: text, overrides, zoom, pageBreaks, jump, headingStyle } = state;
  const { lines } = derived;

  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const pid = state.project.id;
  const [sel, setSel] = useState<Sel>(() => savedSels.get(pid) ?? ZERO_SEL);
  const [focused, setFocused] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const [acIndex, setAcIndex] = useState(0);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [caretBox, setCaretBox] = useState<{ top: number; left: number; bottom: number } | null>(null);
  const [acPos, setAcPos] = useState<{ top: number; left: number; visible: boolean }>({ top: 0, left: 0, visible: false });
  const [scrollTick, setScrollTick] = useState(0);
  const [layerHeight, setLayerHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  const pendingSel = useRef<Sel | null>(null);
  const goalX = useRef<number | null>(null);
  const dragging = useRef(false);
  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; last: number }>({ past: [], future: [], last: 0 });

  // Senaste värden för fönsterlyssnare.
  const sceneAtCursor = state.cursor.sceneId;
  const live = useRef({ text, overrides, lines, sel, pid, sceneId: sceneAtCursor });
  live.current = { text, overrides, lines, sel, pid, sceneId: sceneAtCursor };

  const lineIndexAt = useCallback((offset: number): number => {
    const ls = live.current.lines;
    let lo = 0;
    let hi = ls.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ls[mid].offset <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }, []);

  // -------------------------------------------------------------------------
  // Markering och ändringar

  const applySel = useCallback((s: Sel) => {
    const ta = taRef.current;
    if (ta) ta.setSelectionRange(s.start, s.end, s.backward ? 'backward' : 'forward');
    setSel(s);
    savedSels.set(live.current.pid, s);
  }, []);

  const commit = useCallback(
    (nextText: string, nextOv: Record<number, LineType>, s: Sel, mode: 'auto' | 'force') => {
      const h = history.current;
      const now = Date.now();
      const cur = live.current;
      if (mode === 'force' || now - h.last > 700) {
        h.past.push({ text: cur.text, overrides: cur.overrides, sel: cur.sel });
        if (h.past.length > 200) h.past.shift();
      }
      h.last = mode === 'force' ? 0 : now;
      h.future = [];
      pendingSel.current = s;
      goalX.current = null;
      dispatch({ type: 'EDIT', script: nextText, overrides: nextOv, sceneId: live.current.sceneId });
      setSel(s);
      savedSels.set(live.current.pid, s);
    },
    [dispatch],
  );

  // Körs efter varje rendering: återställ markering när React skrivit om textarean.
  useLayoutEffect(() => {
    const p = pendingSel.current;
    const ta = taRef.current;
    if (p && ta && ta.value === text) {
      ta.setSelectionRange(p.start, p.end, p.backward ? 'backward' : 'forward');
      pendingSel.current = null;
    }
  });

  const restore = (snap: Snapshot) => {
    pendingSel.current = snap.sel;
    dispatch({ type: 'EDIT', script: snap.text, overrides: snap.overrides, sceneId: null });
    setSel(snap.sel);
    history.current.last = 0;
  };

  const undo = () => {
    const h = history.current;
    const snap = h.past.pop();
    if (!snap) return;
    h.future.push({ text, overrides, sel });
    restore(snap);
  };

  const redo = () => {
    const h = history.current;
    const snap = h.future.pop();
    if (!snap) return;
    h.past.push({ text, overrides, sel });
    restore(snap);
  };

  /** Ersätter [from, to) med `insert`; `mutate` får tvingade typer i den nya textens radnummer. */
  const replaceRange = (
    from: number,
    to: number,
    insert: string,
    mutate?: (ov: Record<number, LineType>) => void,
    caretAt?: number,
  ) => {
    const next = text.slice(0, from) + insert + text.slice(to);
    const ov = shiftOverrides(overrides, text, next);
    mutate?.(ov);
    const c = caretAt ?? from + insert.length;
    commit(next, ov, { start: c, end: c, backward: false }, 'force');
  };

  /** Live-versalisering av raden där markören står. */
  const autoUppercase = (nextText: string, ov: Record<number, LineType>, caret: number): string => {
    const li = nextText.slice(0, caret).split('\n').length - 1;
    const ls = classifyLines(nextText, { overrides: ov, lenientLine: li });
    const l = ls[li];
    if (!l || !UPPERCASE_TYPES.has(l.type) || l.markerPrefix > 0) return nextText;
    const up = upperSafe(l.raw);
    if (up === l.raw) return nextText;
    return nextText.slice(0, l.offset) + up + nextText.slice(l.offset + l.raw.length);
  };

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    let next = ta.value;
    const ov = shiftOverrides(overrides, text, next);
    const composing = (e.nativeEvent as InputEvent).isComposing === true;
    if (!composing) next = autoUppercase(next, ov, ta.selectionStart);
    commit(next, ov, { start: ta.selectionStart, end: ta.selectionEnd, backward: false }, 'auto');
  };

  // -------------------------------------------------------------------------
  // Aktuell rad och förslag

  const focusPos = focusOf(sel);
  const li = lineIndexAt(focusPos);
  const line = lines[li] ?? lines[0];
  const prevBlank = li === 0 || isBlank(lines[li - 1]?.raw);
  const acKey = `${li}|${line.raw}`;
  // Platser lärs in både från story bible och från platser som redan skrivits i manuset.
  const locationNames = useMemo(() => {
    const set = new Set(state.locations.map((l) => l.name.toUpperCase()));
    for (const s of derived.scenes) if (s.location) set.add(s.location.toUpperCase());
    return [...set];
  }, [state.locations, derived.scenes]);

  const suggestions: Suggestion[] = useMemo(() => {
    if (!focused || sel.start !== sel.end || dismissedKey === acKey) return [];
    return getSuggestions({
      lineText: line.raw,
      caretCol: focusPos - line.offset,
      prevLineBlank: prevBlank,
      lineType: line.type,
      locations: locationNames,
      characters: derived.characterStats,
      headingStyle,
    });
  }, [focused, sel.start, sel.end, dismissedKey, acKey, line, focusPos, prevBlank, locationNames, derived.characterStats, headingStyle]);

  const acOpen = suggestions.length > 0 && acPos.visible;

  useEffect(() => setAcIndex(0), [acKey]);

  const knownNames = useMemo(() => new Set(derived.characterStats.map((c) => c.name)), [derived.characterStats]);

  const acceptSuggestion = (sug: Suggestion) => {
    const from = line.offset + sug.replaceFrom;
    const to = line.offset + sug.replaceTo;
    const idx = li;
    replaceRange(from, to, sug.insert, (ov) => {
      if (sug.kind === 'character' || sug.kind === 'extension') ov[idx] = 'character';
      else delete ov[idx];
    });
    setDismissedKey(null);
  };

  /**
   * "Allt ska vara convertable": skriver man ett INT./EXT.-prefix i början av en
   * rad som inte redan är en scenrubrik konverteras raden automatiskt. Två fall:
   * - Ingen tom rad före: en tom rad bryts in ovanför och raden tvingas till
   *   scenrubrik. Behöver inte tom rad för att triggas — prefixet är i sig ett
   *   otvetydigt tecken.
   * - Tom rad finns redan men en tidigare tvingad typ (t.ex. från Enter-hanteringen
   *   som antar att nästa rad blir action) blockerar den vanliga igenkänningen:
   *   då tas bara den motstridiga tvingningen bort.
   */
  useEffect(() => {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.type === 'scene_heading') continue;
      if (!HEADING_PREFIX_RE.test(l.raw.trimStart())) continue;
      const idx = i;
      const prevRaw = i > 0 ? lines[i - 1].raw : undefined;
      if (i === 0 || isBlank(prevRaw)) {
        if (overrides[idx] === undefined) continue; // redan naturligt igenkänd
        const nextOv = { ...overrides };
        delete nextOv[idx];
        commit(text, nextOv, sel, 'force');
        break;
      }
      const caretShift = l.offset <= sel.start ? 1 : 0;
      replaceRange(l.offset, l.offset, '\n', (ov) => {
        ov[idx + 1] = 'scene_heading';
      }, sel.start + caretShift);
      break; // en åt gången — effekten körs igen efter omrendering
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  // -------------------------------------------------------------------------
  // Smal skärm: sidan (fast PAGE_WIDTH px, för radbrytningsmatte/karaktärsindrag)
  // skalas ner så den får plats i bredd istället för att bara skrollas horisontellt.

  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setViewportWidth((prev) => (prev === w ? prev : w));
    });
    ro.observe(sc);
    return () => ro.disconnect();
  }, []);

  // -------------------------------------------------------------------------
  // Positionering: markör, osynlig textarea, förslagslista

  useLayoutEffect(() => {
    const caretEl = layerRef.current?.querySelector<HTMLElement>('.sp-caret');
    const wrap = wrapRef.current;
    if (!caretEl || !wrap) {
      setCaretBox(null);
      return;
    }
    const r = caretEl.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const box = { top: r.top - w.top, left: r.left - w.left, bottom: r.bottom - w.top };
    setCaretBox((prev) =>
      prev && prev.top === box.top && prev.left === box.left && prev.bottom === box.bottom ? prev : box,
    );
    const h = layerRef.current?.offsetHeight ?? 0;
    setLayerHeight((prev) => (prev === h ? prev : h));
  });

  useLayoutEffect(() => {
    const list = listRef.current;
    const sc = scrollRef.current;
    const wrap = wrapRef.current;
    if (!list || !sc || !wrap || !caretBox || suggestions.length === 0) {
      setAcPos((p) => (p.visible ? { ...p, visible: false } : p));
      return;
    }
    const s = sc.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const visTop = s.top - w.top;
    const visBottom = s.bottom - w.top;
    const h = list.offsetHeight;
    const lw = list.offsetWidth;
    let top = caretBox.bottom + 6;
    if (top + h > visBottom - 8) top = caretBox.top - h - 6;
    top = Math.max(visTop + 8, Math.min(top, visBottom - h - 8));
    const left = Math.max(8, Math.min(caretBox.left - 14, wrap.clientWidth - lw - 8));
    const visible = caretBox.bottom > visTop && caretBox.top < visBottom;
    setAcPos((p) => (p.top === top && p.left === left && p.visible === visible ? p : { top, left, visible }));
  }, [caretBox, suggestions, scrollTick]);

  // Håll markören synlig efter ändring/förflyttning.
  useEffect(() => {
    if (!focused || dragging.current) return;
    const caretEl = layerRef.current?.querySelector<HTMLElement>('.sp-caret');
    const sc = scrollRef.current;
    if (!caretEl || !sc) return;
    const r = caretEl.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    const margin = 56;
    if (r.top < s.top + margin) sc.scrollTop -= s.top + margin - r.top;
    else if (r.bottom > s.bottom - margin) sc.scrollTop += r.bottom - (s.bottom - margin);
  }, [sel.start, sel.end, text, focused]);

  // Hopp från scenrail, dashboard eller kommandopalett.
  useEffect(() => {
    if (!jump || jump.nonce === consumedJump) return;
    consumedJump = jump.nonce;
    const target = live.current.lines[jump.line];
    if (!target) return;
    const ta = taRef.current;
    ta?.focus({ preventScroll: true });
    applySel({ start: target.offset, end: target.offset, backward: false });
    requestAnimationFrame(() => {
      const el = layerRef.current?.children[jump.line] as HTMLElement | undefined;
      const sc = scrollRef.current;
      if (!el || !sc) return;
      sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 48;
    });
  }, [jump, applySel]);

  // Återställ markering vid montering.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const s = savedSels.get(pid) ?? ZERO_SEL;
    const max = ta.value.length;
    ta.setSelectionRange(Math.min(s.start, max), Math.min(s.end, max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Statusbar: radtyp, rad, kolumn, scen.
  useEffect(() => {
    const scene = derived.scenes.find(
      (s) => s.hasText && s.headingLine !== null && s.endLine !== null && li >= s.headingLine && li <= s.endLine,
    );
    const cursor = { line: li, col: focusPos - line.offset, type: line.type, sceneId: scene?.scene_id ?? null };
    const c = state.cursor;
    if (c.line !== cursor.line || c.col !== cursor.col || c.type !== cursor.type || c.sceneId !== cursor.sceneId) {
      dispatch({ type: 'SET_CURSOR', cursor });
    }
  }, [li, focusPos, line, derived.scenes, state.cursor, dispatch]);

  // -------------------------------------------------------------------------
  // Mus → dokumentposition

  const offsetFromPoint = useCallback((x: number, y: number): number => {
    const layer = layerRef.current;
    if (!layer || layer.children.length === 0) return 0;
    const els = layer.children;
    const n = els.length;
    const first = els[0].getBoundingClientRect();
    if (y < first.top) return 0;
    const last = els[n - 1].getBoundingClientRect();
    if (y > last.bottom) return live.current.text.length;

    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (els[mid].getBoundingClientRect().bottom < y) lo = mid + 1;
      else hi = mid;
    }
    const el = els[lo] as HTMLElement;
    const rect = el.getBoundingClientRect();
    const cy = Math.min(Math.max(y, rect.top + 2), rect.bottom - 2);
    const start = Number(el.dataset.start);
    const len = Number(el.dataset.len);

    const pos = caretFromPoint(x, cy);
    if (pos && el.contains(pos.node) && pos.node.nodeType === Node.TEXT_NODE) {
      const span = pos.node.parentElement?.closest<HTMLElement>('[data-o]');
      if (span) return Math.min(start + len, Math.max(start, Number(span.dataset.o) + pos.offset));
    }
    const spans = el.querySelectorAll<HTMLElement>('[data-o]');
    if (spans.length === 0) return start;
    const firstSpan = spans[0].getBoundingClientRect();
    return x < firstSpan.left && cy < firstSpan.bottom ? start : start + len;
  }, []);

  const onPageMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const ta = taRef.current;
    if (!ta) return;
    ta.focus({ preventScroll: true });
    setFocusRing(false);
    goalX.current = null;
    const off = offsetFromPoint(e.clientX, e.clientY);
    const t = live.current.text;

    if (e.detail === 2) {
      const [a, b] = wordRangeAt(t, off);
      applySel({ start: a, end: b, backward: false });
      return;
    }
    if (e.detail >= 3) {
      const l = live.current.lines[lineIndexAt(off)];
      applySel({ start: l.offset, end: l.offset + l.raw.length, backward: false });
      return;
    }

    const anchor = e.shiftKey ? anchorOf(live.current.sel) : off;
    applySel(selFrom(anchor, off));
    dragging.current = true;

    const onMove = (ev: MouseEvent) => {
      const sc = scrollRef.current;
      if (sc) {
        const s = sc.getBoundingClientRect();
        if (ev.clientY < s.top + 20) sc.scrollTop -= 16;
        else if (ev.clientY > s.bottom - 20) sc.scrollTop += 16;
      }
      applySel(selFrom(anchor, offsetFromPoint(ev.clientX, ev.clientY)));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const moveVertical = (dir: -1 | 1, extend: boolean) => {
    const sc = scrollRef.current;
    let caretEl = layerRef.current?.querySelector<HTMLElement>('.sp-caret');
    if (!sc || !caretEl) return;
    const step = (LINE_H * zoom) / 100;
    let r = caretEl.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    if (dir < 0 && r.top - s.top < step * 2) sc.scrollTop -= step * 3;
    if (dir > 0 && s.bottom - r.bottom < step * 2) sc.scrollTop += step * 3;
    caretEl = layerRef.current?.querySelector<HTMLElement>('.sp-caret') ?? caretEl;
    r = caretEl.getBoundingClientRect();
    const x = goalX.current ?? r.left + 1;
    const cy = (r.top + r.bottom) / 2;
    const target = offsetFromPoint(x, dir < 0 ? cy - step : cy + step);
    const cur = live.current.sel;
    applySel(extend ? selFrom(anchorOf(cur), target) : { start: target, end: target, backward: false });
    goalX.current = x;
  };

  // -------------------------------------------------------------------------
  // Tangentbord

  const isEnterCharacter = (idx: number): boolean => {
    const l = lines[idx];
    const t = l.raw.trim();
    const pb = idx === 0 || isBlank(lines[idx - 1].raw);
    if (!pb || !t || isHeadingText(t) || !isCharacterCandidate(t)) return false;
    return t === t.toUpperCase() || knownNames.has(stripExtension(t).toUpperCase());
  };

  const forceType = (type: LineType) => {
    const idx = li;
    const l = lines[idx];
    const ov = { ...overrides, [idx]: type };
    let next = text;
    if (UPPERCASE_TYPES.has(type)) {
      next = text.slice(0, l.offset) + upperSafe(l.raw) + text.slice(l.offset + l.raw.length);
    }
    commit(next, ov, sel, 'force');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    const collapsed = sel.start === sel.end;
    const l = line;
    const idx = li;
    const lineEnd = l.offset + l.raw.length;
    const trimmed = l.raw.trim();

    if (acOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = suggestions.length;
        setAcIndex((i) => (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
        return;
      }
      if ((e.key === 'Tab' || e.key === 'Enter') && !mod && !e.shiftKey) {
        e.preventDefault();
        acceptSuggestion(suggestions[Math.min(acIndex, suggestions.length - 1)]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDismissedKey(acKey);
        return;
      }
    }

    if (e.key === 'Escape') {
      taRef.current?.blur();
      return;
    }

    if (mod && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        setDismissedKey(null);
        if (!trimmed && prevBlank) {
          replaceRange(l.offset, lineEnd, 'INT. ', (ov) => delete ov[idx]);
        } else if (!trimmed) {
          replaceRange(l.offset, lineEnd, '\nINT. ', (ov) => {
            delete ov[idx];
            delete ov[idx + 1];
          });
        } else {
          replaceRange(lineEnd, lineEnd, '\n\nINT. ', (ov) => {
            delete ov[idx + 1];
            delete ov[idx + 2];
          });
        }
        return;
      }
    }

    // Ctrl/Cmd+1..5 (webbläsare kan reservera Ctrl+siffra; Alt+1..5 fungerar som reserv).
    if ((mod || e.altKey) && FORCE_KEYS[e.key]) {
      e.preventDefault();
      forceType(FORCE_KEYS[e.key]);
      return;
    }

    if (e.key === 'Tab' && !mod) {
      e.preventDefault();
      if (collapsed && !trimmed) {
        const cur: LineType = l.type === 'empty' ? 'action' : l.type;
        commit(text, { ...overrides, [idx]: nextInCycle(cur, e.shiftKey) }, sel, 'force');
      }
      return;
    }

    if (e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && collapsed) {
      if (l.type === 'scene_heading' && trimmed) {
        e.preventDefault();
        replaceRange(lineEnd, lineEnd, '\n\n', (ov) => {
          delete ov[idx + 1];
          ov[idx + 2] = 'action';
        });
        return;
      }
      if (l.type === 'character' || (l.type === 'action' && isEnterCharacter(idx))) {
        e.preventDefault();
        const up = l.markerPrefix > 0 ? l.raw : upperSafe(l.raw);
        replaceRange(
          l.offset,
          lineEnd,
          `${up}\n`,
          (ov) => {
            if (l.markerPrefix === 0) ov[idx] = 'character';
            ov[idx + 1] = 'dialogue';
          },
          l.offset + up.length + 1,
        );
        return;
      }
      if (l.type === 'parenthetical') {
        e.preventDefault();
        replaceRange(lineEnd, lineEnd, '\n', (ov) => {
          ov[idx + 1] = 'dialogue';
        });
        return;
      }
      if (l.type === 'dialogue') {
        e.preventDefault();
        if (!trimmed) {
          replaceRange(l.offset, lineEnd, '\n', (ov) => {
            delete ov[idx];
            ov[idx + 1] = 'action';
          });
        } else {
          replaceRange(focusPos, focusPos, '\n', (ov) => {
            if (focusPos === lineEnd) ov[idx + 1] = 'dialogue';
          });
        }
        return;
      }
    }

    if (e.key === '(' && collapsed && !trimmed && idx > 0) {
      const prev = lines[idx - 1];
      if (prev.type === 'character' && !isBlank(prev.raw)) {
        e.preventDefault();
        replaceRange(l.offset, lineEnd, '()', (ov) => {
          ov[idx] = 'parenthetical';
        }, l.offset + 1);
        return;
      }
    }

    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !mod && !e.altKey) {
      e.preventDefault();
      moveVertical(e.key === 'ArrowUp' ? -1 : 1, e.shiftKey);
      return;
    }

    if ((e.key === 'Home' || e.key === 'End') && !mod) {
      e.preventDefault();
      const target = e.key === 'Home' ? l.offset : lineEnd;
      applySel(e.shiftKey ? selFrom(anchorOf(sel), target) : { start: target, end: target, backward: false });
      goalX.current = null;
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') goalX.current = null;
  };

  const onSelect = () => {
    const ta = taRef.current;
    if (!ta || pendingSel.current) return;
    const s: Sel = { start: ta.selectionStart, end: ta.selectionEnd, backward: ta.selectionDirection === 'backward' };
    setSel((prev) => (prev.start === s.start && prev.end === s.end && prev.backward === s.backward ? prev : s));
    savedSels.set(live.current.pid, s);
  };

  // -------------------------------------------------------------------------

  const sceneNumbers = useMemo(() => {
    const out: Record<number, string> = {};
    derived.scenes.forEach((s, i) => {
      if (s.headingLine !== null) out[s.headingLine] = String(i + 1);
    });
    return out;
  }, [derived.scenes]);

  const pageBreakCount = pageBreaks ? Math.floor(Math.max(0, layerHeight - 1) / (ROWS_PER_PAGE * LINE_H)) : 0;
  const fitsWithoutScroll = viewportWidth !== null && viewportWidth >= PAGE_WIDTH + 48;
  const autoFitScale = viewportWidth ? Math.max(0.32, Math.min(1, (viewportWidth - 24) / PAGE_WIDTH)) : 1;
  const scale = fitsWithoutScroll || viewportWidth === null ? zoom / 100 : autoFitScale;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {minimal && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_FOCUS_MODE', on: false })}
          className="glass micro absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full px-3.5 py-2 text-muted transition-colors duration-150 hover:text-text"
          title="Avsluta fokusläge (Esc)"
        >
          <Icon name="close" size={12} />
          Avsluta fokusläge
        </button>
      )}
      {!minimal && (
        <div className="flex h-12 shrink-0 items-center gap-5 border-b border-line px-5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">
          <label className="flex items-center gap-2.5">
            <MonoLabel tone="muted">Element</MonoLabel>
            <select
              className="field h-8 w-[170px] font-mono text-[0.68rem] uppercase"
              value={ELEMENT_OPTIONS.includes(line.type) ? line.type : 'action'}
              onChange={(e) => {
                forceType(e.target.value as LineType);
                taRef.current?.focus({ preventScroll: true });
              }}
            >
              {ELEMENT_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {LINE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          {fitsWithoutScroll ? (
            <div role="group" aria-label="Zoom" className="hidden items-center gap-1.5 sm:flex">
              <MonoLabel tone="muted" className="mr-1">
                Zoom
              </MonoLabel>
              {([90, 100, 110] as Zoom[]).map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={zoom === z}
                  onClick={() => dispatch({ type: 'SET_ZOOM', zoom: z })}
                  className={`h-8 rounded-btn px-2.5 transition-colors duration-150 ${zoom === z ? 'bg-raised text-accent' : 'hover:bg-raised hover:text-text'}`}
                >
                  {z}%
                </button>
              ))}
            </div>
          ) : (
            <span className="micro text-muted">Anpassad {Math.round(scale * 100)}%</span>
          )}
          <button
            type="button"
            aria-pressed={pageBreaks}
            onClick={() => dispatch({ type: 'TOGGLE_PAGE_BREAKS' })}
            className={`h-8 rounded-btn px-2.5 tracking-[0.1em] transition-colors duration-150 ${pageBreaks ? 'bg-raised text-accent' : 'hover:bg-raised hover:text-text'}`}
          >
            Sidbrytningar
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_FOCUS_MODE', on: true })}
            className="flex h-8 items-center gap-1.5 rounded-btn px-2.5 tracking-[0.1em] transition-colors duration-150 hover:bg-raised hover:text-text"
            title="Fokusläge (Ctrl+.)"
          >
            <Icon name="focus" size={13} />
            Fokusläge
          </button>
          <span className="ml-auto hidden truncate whitespace-nowrap text-[0.64rem] 2xl:inline">
            TAB CYKLA · CTRL+ENTER SCEN · CTRL+K KOMMANDON
          </span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto bg-ink"
        onScroll={suggestions.length ? () => setScrollTick((t) => t + 1) : undefined}
      >
        <div ref={wrapRef} className="relative mx-auto py-8" style={{ width: PAGE_WIDTH * scale }}>
          <div
            className={`min-h-[calc(100vh-220px)] bg-paper shadow-[0_0_0_1px_rgba(0,0,0,0.5)] transition-shadow duration-150 ${
              focusRing ? 'outline outline-2 outline-offset-[3px] outline-accent' : ''
            }`}
            style={{ zoom: scale }}
          >
            <div className="relative cursor-text p-16" onMouseDown={onPageMouseDown}>
              <HighlightLayer
                ref={layerRef}
                lines={lines}
                selection={sel}
                caret={focused ? focusPos : null}
                caretIdle={!focused}
                sceneNumbers={sceneNumbers}
              />
              {Array.from({ length: pageBreakCount }, (_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#c9c3b2]"
                  style={{ top: 64 + (i + 1) * ROWS_PER_PAGE * LINE_H }}
                >
                  <span className="absolute right-3 top-1 font-mono text-[10px] text-[#8a8a80]">SID {i + 2}</span>
                </div>
              ))}
            </div>
          </div>

          <textarea
            ref={taRef}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onSelect={onSelect}
            onFocus={(e) => {
              setFocused(true);
              setFocusRing(e.currentTarget.matches(':focus-visible'));
            }}
            onBlur={() => {
              setFocused(false);
              setFocusRing(false);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            wrap="off"
            aria-label="Manustext i Fountain-format"
            aria-multiline="true"
            aria-autocomplete="list"
            aria-controls={acOpen ? 'ac-list' : undefined}
            aria-activedescendant={acOpen ? `ac-opt-${acIndex}` : undefined}
            className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 font-script text-transparent outline-none focus-visible:outline-none"
            style={{
              top: caretBox?.top ?? 0,
              left: caretBox?.left ?? 0,
              width: 2,
              height: LINE_H,
              fontSize: 15,
              lineHeight: `${LINE_H}px`,
              caretColor: 'transparent',
              opacity: 0,
            }}
          />

          {suggestions.length > 0 && (
            <ul
              ref={listRef}
              id="ac-list"
              role="listbox"
              aria-label="Förslag"
              className="glass-strong absolute z-20 min-w-[220px] max-w-[360px] overflow-hidden rounded-[6px] p-1"
              style={{ top: acPos.top, left: acPos.left, visibility: acPos.visible ? 'visible' : 'hidden' }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestions.map((s, i) => {
                const active = i === acIndex;
                return (
                  <li
                    key={s.id}
                    id={`ac-opt-${i}`}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setAcIndex(i)}
                    onClick={() => acceptSuggestion(s)}
                    className={`flex h-7 cursor-pointer items-center justify-between gap-4 rounded-[4px] px-2.5 font-mono text-[0.78rem] ${
                      active ? 'bg-accent text-accentInk' : 'text-text'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    <span className={`text-[0.6rem] tracking-[0.12em] ${active ? 'text-accentInk' : 'text-muted'}`}>{s.detail}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
