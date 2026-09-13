// Förslagslogik för editorns autocomplete. Rena funktioner.

import type { HeadingStyle, LineType } from '../types';
import { HEADING_PREFIX_RE, isCharacterCandidate, stripExtension } from './parse';

export type SuggestionKind = 'heading' | 'location' | 'time' | 'character' | 'extension';

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  label: string;
  detail: string;
  /** Kolumnintervall i raden som ersätts med `insert`. */
  replaceFrom: number;
  replaceTo: number;
  insert: string;
}

export interface CharacterStat {
  name: string;
  lines: number;
}

export interface AutocompleteContext {
  lineText: string;
  caretCol: number;
  prevLineBlank: boolean;
  lineType: LineType;
  locations: readonly string[];
  characters: readonly CharacterStat[];
  /** Bindestreck ("PLATS – TID") eller punkt ("PLATS. TID.") mellan plats och tid. */
  headingStyle: HeadingStyle;
}

export const HEADING_PREFIXES = ['EXT.', 'INT.', 'INT./EXT.', 'EST.', 'ÖVERGÅNG'] as const;

export const TIMES_OF_DAY = [
  'DAG',
  'NATT',
  'KVÄLL',
  'MORGON',
  'SKYMNING',
  'GRYNING',
  'SENARE',
  'FORTSÄTTNING',
] as const;

export const EXTENSIONS = ['(FORTS.)', '(V.O.)', '(O.S.)'] as const;

const MAX = 6;

const up = (s: string): string => s.toUpperCase();

export function getSuggestions(ctx: AutocompleteContext): Suggestion[] {
  const { lineText, caretCol } = ctx;
  if (caretCol !== lineText.length) return [];

  const characterSlot = ctx.lineType === 'character' || ctx.prevLineBlank;
  if (!characterSlot) return [];

  const len = lineText.length;
  const trimmed = lineText.trimStart();
  const lead = len - trimmed.length;

  // 1. Scenrubrik med prefix → plats → tid på dygnet
  const heading = trimmed.match(HEADING_PREFIX_RE);
  if (ctx.prevLineBlank && heading && /\s/u.test(trimmed.charAt(heading[0].length))) {
    const period = ctx.headingStyle === 'period';
    const sepRe = period ? /\.\s/u : /\s[-–—]\s/u;
    const sepLen = period ? 2 : 3;
    const afterPrefix = lead + heading[0].length + 1;
    const rest = lineText.slice(afterPrefix);
    const sepAt = rest.search(sepRe);
    if (sepAt !== -1) {
      const from = afterPrefix + sepAt + sepLen;
      const typed = up(lineText.slice(from).trim());
      return TIMES_OF_DAY.filter((t) => t.startsWith(typed) && t !== typed)
        .slice(0, MAX)
        .map((t) => ({
          id: `time-${t}`,
          kind: 'time',
          label: t,
          detail: 'TID',
          replaceFrom: from,
          replaceTo: len,
          insert: period ? `${t}.` : t,
        }));
    }
    const typed = up(rest.trim());
    return ctx.locations
      .filter((l) => up(l).startsWith(typed) && up(l) !== typed)
      .slice(0, MAX)
      .map((l) => ({
        id: `loc-${l}`,
        kind: 'location',
        label: up(l),
        detail: 'PLATS',
        replaceFrom: afterPrefix,
        replaceTo: len,
        insert: period ? `${up(l)}. ` : `${up(l)} – `,
      }));
  }

  // 2. Karaktärstillägg efter "("
  const paren = lineText.indexOf('(');
  if (paren > 0) {
    const name = up(lineText.slice(0, paren).trim());
    const known = ctx.characters.some((c) => c.name === name);
    if (ctx.lineType === 'character' || known) {
      const typed = up(lineText.slice(paren));
      return EXTENSIONS.filter((e) => e.startsWith(typed) && e !== typed).map((e) => ({
        id: `ext-${e}`,
        kind: 'extension',
        label: e,
        detail: 'TILLÄGG',
        replaceFrom: paren,
        replaceTo: len,
        insert: e,
      }));
    }
    return [];
  }

  const typed = up(trimmed.trim());
  if (!typed) return [];
  const out: Suggestion[] = [];

  // 3. Scenrubrikprefix när raden börjar med E, I eller Ö
  if (ctx.prevLineBlank && /^[EIÖ]/u.test(typed) && !/\s/u.test(trimmed)) {
    for (const p of HEADING_PREFIXES) {
      if (p.startsWith(typed) && p !== typed) {
        out.push({
          id: `head-${p}`,
          kind: 'heading',
          label: p,
          detail: 'SCENRUBRIK',
          replaceFrom: 0,
          replaceTo: len,
          insert: `${p} `,
        });
      }
    }
  }

  // 4. Karaktärer, sorterade efter antal repliker
  if (ctx.lineType === 'character' || isCharacterCandidate(trimmed)) {
    const bare = up(stripExtension(typed));
    const matches = [...ctx.characters]
      .filter((c) => c.name.startsWith(bare) && c.name !== bare)
      .sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name, 'sv'));
    for (const c of matches) {
      out.push({
        id: `char-${c.name}`,
        kind: 'character',
        label: c.name,
        detail: `${c.lines} REPL.`,
        replaceFrom: 0,
        replaceTo: len,
        insert: c.name,
      });
    }
  }

  return out.slice(0, MAX);
}

/** Tab-cykelns ordning för tomma rader. */
export const TAB_CYCLE: readonly LineType[] = [
  'action',
  'character',
  'parenthetical',
  'dialogue',
  'transition',
];

export function nextInCycle(current: LineType, backwards = false): LineType {
  const i = TAB_CYCLE.indexOf(current);
  const base = i === -1 ? 0 : i;
  const n = TAB_CYCLE.length;
  return TAB_CYCLE[(base + (backwards ? n - 1 : 1)) % n];
}
