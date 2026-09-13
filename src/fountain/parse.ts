// Fountain-parser: radklassificering och scenuppdelning.
// Rena funktioner utan React-beroenden.

import type { HeadingStyle, IntExt, LineType, ParsedLine, PipelineStage, Scene, Status } from '../types';

export type LineOverrides = Readonly<Record<number, LineType>>;

export interface ClassifyOptions {
  /** Editorns tvingade radtyper (Tab-cykling, Ctrl+1..5), per radindex. */
  overrides?: LineOverrides;
  /** Rad där övergångar matchas versalokänsligt (raden som skrivs just nu). */
  lenientLine?: number;
}

/** Scenrubrikprefix, versalokänsligt. Ordningen spelar roll (längst först). */
export const HEADING_PREFIX_RE =
  /^(INT\.\/EXT\.|INT\/EXT\.?|I\/E\.?|INT\.|EXT\.|EST\.|ÖVERGÅNG|INT(?= )|EXT(?= ))/iu;

/**
 * Manuellt scennummer som vissa manusförfattare skriver själva framför rubriken,
 * t.ex. "2. EXT. KIOSK. DAG." eller "36A. EXT. …". Rent kosmetiskt — påverkar
 * inte appens egna SC-numrering, men gör att raden ändå känns igen som en scenrubrik.
 */
const MANUAL_SCENE_NUMBER_RE = /^\d{1,3}[A-ZÅÄÖ]{0,2}\.\s+/iu;

const TRANSITION_END_RE = /(TO:|TILL:|FADE OUT\.|TONA UT\.|SMASH CUT:)$/u;

const EXTENSION_RE = /\s*\((FORTS\.|V\.O\.|O\.S\.)\)\s*$/iu;

const NOTE_RE = /^\[\[.*\]\]$/u;

export const UPPERCASE_TYPES: ReadonlySet<LineType> = new Set<LineType>([
  'scene_heading',
  'character',
  'transition',
]);

const hasLetter = (s: string): boolean => /\p{L}/u.test(s);

const isUpper = (s: string): boolean => hasLetter(s) && s === s.toUpperCase();

export function isBlank(raw: string | undefined): boolean {
  return raw === undefined || raw.trim() === '';
}

export function stripExtension(name: string): string {
  return name.replace(EXTENSION_RE, '').trim();
}

/** Tar bort ett manuellt inskrivet scennummer i början ("2. ", "36A. ") om det finns. */
export function stripManualSceneNumber(text: string): string {
  return text.replace(MANUAL_SCENE_NUMBER_RE, '');
}

export function isHeadingText(text: string): boolean {
  return HEADING_PREFIX_RE.test(text.trim());
}

/** Som isHeadingText, men accepterar även ett manuellt scennummer framför prefixet. */
export function looksLikeSceneHeading(text: string): boolean {
  const t = text.trim();
  return isHeadingText(t) || isHeadingText(stripManualSceneNumber(t));
}

export function isTransitionText(text: string, lenient = false): boolean {
  const t = text.trim();
  if (!t) return false;
  const candidate = lenient ? t.toUpperCase() : t;
  if (!lenient && !isUpper(t)) return false;
  return TRANSITION_END_RE.test(candidate);
}

/**
 * Regel 4 utan kontextkraven (tom rad före / nästa rad ej tom):
 * ≤ 45 tecken och antingen versal eller 1–4 ord utan avslutande skiljetecken.
 * En ensam avslutande kolon ("Måns:") tolereras — en vanlig manusdialekt.
 */
export function isCharacterCandidate(text: string): boolean {
  let t = text.trim();
  if (t.endsWith(':')) t = t.slice(0, -1).trim();
  if (!t || t.length > 45 || t.startsWith('(')) return false;
  const stripped = stripExtension(t);
  if (!hasLetter(stripped)) return false;
  if (isUpper(t)) return true;
  const words = stripped.split(/\s+/u).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  return !/[.,!?:;…"”'’)\]\-–—]$/u.test(stripped);
}

interface ForcedResult {
  type: LineType;
  prefix: number;
  suffix: number;
}

function detectForced(raw: string): ForcedResult | null {
  const lead = raw.length - raw.trimStart().length;
  const t = raw.trim();
  if (!t) return null;
  if (NOTE_RE.test(t)) return { type: 'note', prefix: 0, suffix: 0 };
  if (t.startsWith('>') && t.endsWith('<') && t.length > 1) {
    return { type: 'centered', prefix: lead + 1, suffix: raw.length - raw.trimEnd().length + 1 };
  }
  const first = t[0];
  if (first === '.' && t[1] !== '.' && t.length > 1) return { type: 'scene_heading', prefix: lead + 1, suffix: 0 };
  if (first === '@') return { type: 'character', prefix: lead + 1, suffix: 0 };
  if (first === '>') return { type: 'transition', prefix: lead + 1, suffix: 0 };
  if (first === '=' && !/^={3,}$/u.test(t)) return { type: 'synopsis', prefix: lead + 1, suffix: 0 };
  if (first === '#') {
    const hashes = t.match(/^#+/u)?.[0].length ?? 1;
    return { type: 'section', prefix: lead + hashes, suffix: 0 };
  }
  if (first === '!') return { type: 'action', prefix: lead + 1, suffix: 0 };
  return null;
}

export function classifyLines(text: string, options: ClassifyOptions = {}): ParsedLine[] {
  const overrides = options.overrides ?? {};
  const raws = text.split('\n');
  const out: ParsedLine[] = [];
  let offset = 0;

  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i];
    const prevRaw = i > 0 ? raws[i - 1] : undefined;
    const nextRaw = raws[i + 1];
    const prevBlank = i === 0 || isBlank(prevRaw);
    const prev = out[i - 1];
    const prevType: LineType | null = prev && !isBlank(prev.raw) ? prev.type : null;
    const override = overrides[i];

    let type: LineType = 'action';
    let forced = false;
    let prefix = 0;
    let suffix = 0;
    const t = raw.trim();

    if (!t) {
      type = override ?? 'empty';
      forced = override !== undefined;
    } else {
      const f = detectForced(raw);
      if (f) {
        ({ type, prefix, suffix } = f);
        forced = true;
      } else if (override) {
        type = override;
        forced = true;
      } else if (prevBlank && looksLikeSceneHeading(t)) {
        type = 'scene_heading';
      } else if (isTransitionText(t, options.lenientLine === i && prevBlank)) {
        type = 'transition';
      } else if (prevBlank && !isBlank(nextRaw) && isCharacterCandidate(t)) {
        type = 'character';
      } else if (
        (prevType === 'character' || prevType === 'dialogue') &&
        t.startsWith('(') &&
        t.endsWith(')')
      ) {
        type = 'parenthetical';
      } else if (prevType === 'character' || prevType === 'parenthetical' || prevType === 'dialogue') {
        type = 'dialogue';
      }
    }

    const content = raw.slice(prefix, raw.length - suffix).trim();
    out.push({
      index: i,
      lineId: `L${String(i + 1).padStart(4, '0')}`,
      raw,
      text: type === 'note' ? content.replace(/^\[\[|\]\]$/gu, '').trim() : content,
      type,
      forced,
      markerPrefix: prefix,
      markerSuffix: suffix,
      offset,
    });
    offset += raw.length + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scener

export interface HeadingParts {
  int_ext: IntExt;
  location: string;
  time_of_day: string | null;
}

/** Separatorn mellan plats och tid, enligt användarens inställning. */
export function headingSeparator(style: HeadingStyle): string {
  return style === 'period' ? '. ' : ' – ';
}

export function parseHeading(heading: string): HeadingParts {
  const raw = stripManualSceneNumber(heading.trim());
  const h = raw.toUpperCase();
  const m = h.match(HEADING_PREFIX_RE);
  let int_ext: IntExt = null;
  let rest = h;
  if (m) {
    const p = m[1].replace(/\./gu, '');
    if (p === 'INT/EXT' || p === 'I/E') int_ext = 'INT/EXT';
    else if (p === 'INT') int_ext = 'INT';
    else if (p === 'EXT') int_ext = 'EXT';
    else if (p === 'EST') int_ext = 'EST';
    rest = h.slice(m[0].length).trim();
  }

  // Bindestreck-stil: "PLATS – TID"
  const dash = rest.search(/\s[-–—]\s/u);
  if (dash !== -1) {
    return { int_ext, location: rest.slice(0, dash).trim(), time_of_day: rest.slice(dash + 3).trim() || null };
  }

  // Punkt-stil: "PLATS. TID." — sista punktavgränsade delen tolkas som tid.
  const withoutTrailingDot = rest.replace(/\.+$/u, '');
  const periodParts = withoutTrailingDot
    .split('.')
    .map((p) => p.trim())
    .filter(Boolean);
  if (periodParts.length >= 2) {
    return { int_ext, location: periodParts.slice(0, -1).join('. '), time_of_day: periodParts[periodParts.length - 1] || null };
  }

  return { int_ext, location: withoutTrailingDot.trim() || rest, time_of_day: null };
}

const ROW_WIDTH: Record<LineType, number> = {
  scene_heading: 61,
  action: 61,
  character: 38,
  parenthetical: 24,
  dialogue: 35,
  transition: 61,
  centered: 61,
  note: 61,
  section: 61,
  synopsis: 61,
  empty: 61,
};

/** Uppskattat antal sidrader för ett radintervall (med radbrytning). */
export function estimateRows(lines: readonly ParsedLine[]): number {
  let rows = 0;
  for (const l of lines) {
    const len = l.text.length;
    rows += Math.max(1, Math.ceil(len / ROW_WIDTH[l.type]));
  }
  return rows;
}

/** rader / 55, avrundat till närmaste 1/8, minst 1/8. */
export function pagesFromRows(rows: number): number {
  return Math.max(1, Math.round((rows / 55) * 8)) / 8;
}

export function formatEighths(pages: number): string {
  const totalEighths = Math.round(pages * 8);
  const whole = Math.floor(totalEighths / 8);
  const rest = totalEighths % 8;
  if (rest === 0) return String(whole);
  if (whole === 0) return `${rest}/8`;
  return `${whole} ${rest}/8`;
}

export const sceneIdFor = (ordinal: number): string => `SC-${String(ordinal).padStart(3, '0')}`;

const DEFAULT_PIPELINE: Record<PipelineStage, Status> = {
  write: 'active',
  prepro: 'todo',
  production: 'todo',
  post: 'todo',
};

export interface SceneRange {
  scene: Scene;
  headingLine: number;
  endLine: number;
}

export function extractSceneRanges(lines: readonly ParsedLine[]): SceneRange[] {
  const ranges: SceneRange[] = [];
  const headings = lines.filter((l) => l.type === 'scene_heading');

  headings.forEach((heading, n) => {
    const endLine = n + 1 < headings.length ? headings[n + 1].index - 1 : lines.length - 1;
    const body = lines.slice(heading.index, endLine + 1);
    const characters: string[] = [];
    const action_lines: Scene['action_lines'] = [];
    const dialogue: Scene['dialogue'] = [];
    let speaker = '';

    for (const l of body) {
      if (l.type === 'character') {
        speaker = stripExtension(l.text.replace(/:$/u, '')).toUpperCase();
        if (speaker && !characters.includes(speaker)) characters.push(speaker);
      } else if (l.type === 'dialogue') {
        dialogue.push({ line_id: l.lineId, character: speaker, text: l.text });
      } else if (l.type === 'action') {
        action_lines.push({ line_id: l.lineId, text: l.text });
      }
    }

    const parts = parseHeading(heading.text);
    ranges.push({
      headingLine: heading.index,
      endLine,
      scene: {
        scene_id: sceneIdFor(n + 1),
        scene_heading: heading.text.toUpperCase(),
        ...parts,
        characters_present: characters,
        action_lines,
        dialogue,
        page_length: pagesFromRows(estimateRows(trimTrailingBlank(body))),
        pipeline: { ...DEFAULT_PIPELINE },
        production: { props: [], cast: {}, lens_id: null, mic_id: null, notes: '' },
      },
    });
  });
  return ranges;
}

function trimTrailingBlank(lines: readonly ParsedLine[]): readonly ParsedLine[] {
  let end = lines.length;
  while (end > 1 && isBlank(lines[end - 1].raw)) end--;
  return lines.slice(0, end);
}

export function extractScenes(lines: readonly ParsedLine[]): Scene[] {
  return extractSceneRanges(lines).map((r) => r.scene);
}

export const LINE_TYPE_LABEL: Record<LineType, string> = {
  scene_heading: 'SCENE HEADING',
  action: 'ACTION',
  character: 'CHARACTER',
  parenthetical: 'PARENTHETICAL',
  dialogue: 'DIALOGUE',
  transition: 'TRANSITION',
  centered: 'CENTERED',
  note: 'NOTE',
  section: 'SECTION',
  synopsis: 'SYNOPSIS',
  empty: 'ACTION',
};
