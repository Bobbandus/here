import type { CreativeItem, GearItem, LensGearItem, Shot, ShotType } from '../../types';

export const SHOT_TYPES: ShotType[] = [
  'EST',
  'WS',
  'MASTER',
  'MS',
  'MCU',
  'CU',
  'ECU',
  '2-SHOT',
  'GROUP',
  'OTS',
  'POV',
  'INSERT',
  'CUTAWAY',
];

export const SHOT_TYPE_LABEL: Record<ShotType, string> = {
  EST: 'Etablering',
  WS: 'Helbild',
  MASTER: 'Totalbild',
  MS: 'Halvbild',
  MCU: 'Halvnära',
  CU: 'Närbild',
  ECU: 'Extrem närbild',
  '2-SHOT': 'Tvåbild',
  GROUP: 'Gruppbild',
  OTS: 'Över axel',
  POV: 'Subjektiv',
  INSERT: 'Insert',
  CUTAWAY: 'Cutaway',
};

export const MOVEMENTS = ['Statisk', 'Pan', 'Tilt', 'Dolly', 'Handhållen', 'Gimbal', 'Kran/drönare'] as const;

/** 0 → A, 25 → Z, 26 → AA */
export function shotLetter(i: number): string {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const totalDuration = (shots: readonly Shot[]): number => shots.reduce((a, s) => a + (s.durationSec || 0), 0);

/** Objektiven i projektets gear-lista — dvs. kategori "Objektiv" med brännvidd ifylld. */
export function lensGear(gear: readonly GearItem[]): LensGearItem[] {
  return gear.filter(
    (g): g is LensGearItem => g.category === 'Objektiv' && typeof g.focalMin === 'number' && typeof g.focalMax === 'number',
  );
}

/**
 * Tolkar en rad ur platshållarens exempel-shotlist ("1A · WS etablering…", "16 mm · 0:08")
 * till en tagning. Ren strängtolkning — ingen AI. `availableLenses` är projektets egna
 * objektiv (från gear-listan) — matchning sker på nämnd brännvidd, inte på ett fast ID.
 */
export function shotFromMockItem(item: CreativeItem, availableLenses: readonly LensGearItem[]): Omit<Shot, 'id'> {
  const body = item.text.includes(' · ') ? item.text.split(' · ').slice(1).join(' · ') : item.text;
  const upper = body.toUpperCase();
  let type: ShotType = 'MS';
  if (upper.includes('INSERT')) type = 'INSERT';
  else if (upper.includes('TVÅ-SHOT')) type = '2-SHOT';
  else if (upper.includes('CUTAWAY')) type = 'CUTAWAY';
  else if (upper.includes('ETABLERING') || upper.includes('ESTABLISHING')) type = 'EST';
  else if (upper.includes('TOTALBILD') || upper.includes('MASTER')) type = 'MASTER';
  else if (upper.includes('GRUPPBILD') || upper.includes('GROUP')) type = 'GROUP';
  else {
    const found = ['ECU', 'MCU', 'OTS', 'POV', 'WS', 'MS', 'CU'].find((t) => new RegExp(`\\b${t}\\b`, 'u').test(upper));
    if (found) type = found as ShotType;
  }

  // Matcha den nämnda brännvidden mot ett objektiv vars intervall täcker den.
  const mentionedMm = Number(item.meta.match(/(\d+)\s*mm/u)?.[1]);
  const lens = Number.isNaN(mentionedMm)
    ? undefined
    : availableLenses.find((l) => mentionedMm >= l.focalMin && mentionedMm <= l.focalMax);
  const lensId = lens?.id ?? null;
  const focalMm = lens ? mentionedMm : null;

  const t = item.meta.match(/(\d+):(\d{2})/u);
  const durationSec = t ? Number(t[1]) * 60 + Number(t[2]) : 10;

  const lower = body.toLowerCase();
  const movement = lower.includes('dolly')
    ? 'Dolly'
    : lower.includes('handhållen')
      ? 'Handhållen'
      : lower.includes('pan')
        ? 'Pan'
        : 'Statisk';

  return { type, lensId, focalMm, movement, description: body, durationSec, done: false };
}
