// Rena hjälpfunktioner för editorns textoperationer.

import type { LineType } from '../../types';

export interface Sel {
  start: number;
  end: number;
  backward: boolean;
}

const countNL = (s: string): number => {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
};

/**
 * Flyttar editorns tvingade radtyper när rader infogas eller tas bort.
 * Beräknar ändringen som gemensamt prefix/suffix mellan gammal och ny text.
 */
export function shiftOverrides(
  ov: Readonly<Record<number, LineType>>,
  before: string,
  after: string,
): Record<number, LineType> {
  const keys = Object.keys(ov);
  if (keys.length === 0 || before === after) return { ...ov };

  let p = 0;
  const min = Math.min(before.length, after.length);
  while (p < min && before.charCodeAt(p) === after.charCodeAt(p)) p++;
  let ea = before.length;
  let eb = after.length;
  while (ea > p && eb > p && before.charCodeAt(ea - 1) === after.charCodeAt(eb - 1)) {
    ea--;
    eb--;
  }
  const removed = countNL(before.slice(p, ea));
  const added = countNL(after.slice(p, eb));
  if (removed === 0 && added === 0) return { ...ov };

  const line = countNL(before.slice(0, p));
  const atLineStart = p === 0 || before.charCodeAt(p - 1) === 10;
  const delta = added - removed;
  const out: Record<number, LineType> = {};

  for (const k of keys) {
    const idx = Number(k);
    const type = ov[idx];
    if (idx < line) {
      out[idx] = type;
    } else if (atLineStart) {
      // Hela rader [line, line+removed) försvann; resten flyttas.
      if (idx >= line + removed) out[idx + delta] = type;
    } else if (idx === line) {
      out[idx] = type;
    } else if (idx > line + removed) {
      out[idx + delta] = type;
    }
  }
  return out;
}

/** Versaler utan att ändra längden (t.ex. ß behålls). */
export function upperSafe(s: string): string {
  let out = '';
  for (const ch of s) {
    const up = ch.toUpperCase();
    out += up.length === ch.length ? up : ch;
  }
  return out;
}

const WORD = /[\p{L}\p{N}_]/u;

export function wordRangeAt(text: string, offset: number): [number, number] {
  let a = offset;
  let b = offset;
  while (a > 0 && WORD.test(text[a - 1])) a--;
  while (b < text.length && WORD.test(text[b])) b++;
  return [a, b];
}

export function selFrom(anchor: number, focus: number): Sel {
  return { start: Math.min(anchor, focus), end: Math.max(anchor, focus), backward: focus < anchor };
}

export const focusOf = (s: Sel): number => (s.backward ? s.start : s.end);
export const anchorOf = (s: Sel): number => (s.backward ? s.end : s.start);
