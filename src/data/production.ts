import type { CastMember, Microphone, PropItem } from '../types';

/** Horisontell sensorbredd i mm (Super 35-liknande) för bildvinkelberäkning. */
export const SENSOR_WIDTH_MM = 24.89;

export const sensorFormats = ['Super 35 · 24.89 mm', 'Fullformat · 36.0 mm (beskuren)'] as const;

/**
 * Objektiv finns inte som en egen delad lista — de är gear-objekt (kategori
 * "Objektiv") i respektive projekts egen `gear`-lista (se `components/plan/shots.ts
 * → lensGear`). De här hjälpfunktionerna är ren matematik och tar bara emot
 * brännviddsintervallet, oavsett var objektivet kommer ifrån.
 */
interface FocalRange {
  focalMin: number;
  focalMax: number;
}

/** Sant för zoomobjektiv (brännvidden täcker ett intervall) — falskt för fasta objektiv (primes). */
export const isZoomLens = (lens: FocalRange): boolean => lens.focalMin !== lens.focalMax;

/** Klipper en brännvidd till objektivets faktiska intervall (hela mm). */
export function clampFocal(mm: number, lens: FocalRange): number {
  return Math.min(lens.focalMax, Math.max(lens.focalMin, Math.round(mm)));
}

/**
 * Tolkar fritt inskriven brännvidd till ett intervall: "50" → fast objektiv
 * (50–50 mm), "12-42" eller "12–42" → zoomintervall (12–42 mm). Returnerar
 * `null` om texten inte går att tolka.
 */
export function parseFocalRange(text: string): FocalRange | null {
  const t = text.trim();
  const range = t.match(/^(\d{1,4})\s*[-–—]\s*(\d{1,4})$/u);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (a > 0 && b > 0) return { focalMin: Math.min(a, b), focalMax: Math.max(a, b) };
  }
  const single = t.match(/^(\d{1,4})$/u);
  if (single) {
    const n = Number(single[1]);
    if (n > 0) return { focalMin: n, focalMax: n };
  }
  return null;
}

/** 2 · atan(sensorbredd / (2 · f)) i grader. Ren matematik. */
export function horizontalAngle(focalMm: number, sensorWidth = SENSOR_WIDTH_MM): number {
  return (2 * Math.atan(sensorWidth / (2 * focalMm)) * 180) / Math.PI;
}

export const microphones: Microphone[] = [
  { id: 'MIC-01', label: 'Røde NTG4+', type: 'Bommik · superkardioid' },
  { id: 'MIC-02', label: 'Sennheiser MKE 600', type: 'Bommik · superkardioid' },
  { id: 'MIC-03', label: 'Røde Wireless GO II', type: 'Myggmik · trådlös' },
  { id: 'MIC-04', label: 'Zoom H5 XY', type: 'Stereo · atmosfär' },
];

export const micPlacements = [
  'Bom ovanifrån',
  'Bom underifrån',
  'Mygg dold under kläder',
  'Plantmik i scenografi',
] as const;

export const audioChannels = ['CH1', 'CH2', 'CH3', 'CH4', 'CH1+2 (dubbel)'] as const;

export const props: PropItem[] = [
  { id: 'PRP-01', name: 'Antagningsblankett', source: 'LAGER', method: 'UTSKRIFT' },
  { id: 'PRP-02', name: 'Busskort', source: 'PRINTPROFFSEN', method: '3D-PRINT' },
  { id: 'PRP-03', name: 'Energidryck (fiktivt märke)', source: 'PRINTPROFFSEN', method: 'ETIKETTRYCK' },
  { id: 'PRP-04', name: 'Tågbiljett Stockholm', source: 'PRINTPROFFSEN', method: 'TRYCK' },
  { id: 'PRP-05', name: 'Stekpanna', source: 'LAGER', method: 'HYLLA 2' },
  { id: 'PRP-06', name: 'Mynt, handfull', source: 'LAGER', method: 'HYLLA 1' },
  { id: 'PRP-07', name: 'Vägskylt ALINGSÅS 4', source: 'PRINTPROFFSEN', method: '3D-PRINT' },
  { id: 'PRP-08', name: 'Räkningar i hög', source: 'LAGER', method: 'UTSKRIFT' },
  { id: 'PRP-09', name: 'Lysrörsarmatur', source: 'LAGER', method: 'HYLLA 4' },
  { id: 'PRP-10', name: 'Hörlurar', source: 'LAGER', method: 'HYLLA 1' },
];

export const cast: CastMember[] = [
  { id: 'CST-1', name: 'Ebba Lindqvist', note: 'Huvudroll, bekräftad' },
  { id: 'CST-2', name: 'Noah Berg', note: 'Bekräftad' },
  { id: 'CST-3', name: 'Selma Karlsson', note: 'Provfilmning 2/10' },
  { id: 'CST-4', name: 'Johan Ek', note: 'Bekräftad, ej helger' },
  { id: 'CST-5', name: 'Birgitta Holm', note: 'Endast röst möjlig' },
  { id: 'CST-6', name: 'Wilmer Sjö', note: 'Minderårig, målsman på plats' },
  { id: 'CST-7', name: 'Tuva Nord', note: 'Bekräftad' },
  { id: 'CST-8', name: 'Elias Strand', note: 'Reserv' },
];
