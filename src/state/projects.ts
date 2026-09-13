// Projektfabrik, lokal lagring (localStorage) och tidsformat. Inget nätverk.

import type { HeadingStyle, ProjectData, ProjectFormat, Settings, Theme } from '../types';

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

export const CHARACTER_COLORS = ['#3be389', '#ffce3f', '#ff4b3e', '#f4f2ec', '#1f9a61', '#9a9aa0'];

export const PROJECT_FORMATS: ProjectFormat[] = ['Långfilm', 'Kortfilm', 'Serieavsnitt', 'Reklamfilm', 'Musikvideo'];

export type ProjectTemplate = 'empty' | 'scene';

export interface NewProjectInput {
  title: string;
  subtitle: string;
  format: ProjectFormat;
  template: ProjectTemplate;
}

const TEMPLATE_SCRIPT = `# AKT ETT

INT. PLATS – DAG

Beskriv vad vi ser.
`;

export function createProject(input: NewProjectInput, now = Date.now()): ProjectData {
  return {
    id: uid('PRJ'),
    title: input.title.trim().toUpperCase() || 'NYTT PROJEKT',
    subtitle: input.subtitle.trim() || `${input.format}smanus`.replace('smanussmanus', 'smanus'),
    format: input.format,
    studio: 'A+ Studios',
    draft: 1,
    createdAt: now,
    updatedAt: now,
    script: input.template === 'scene' ? TEMPLATE_SCRIPT : '',
    overrides: {},
    sceneMeta: {},
    characters: [],
    locations: [],
    notes: [],
    ghostScenes: [],
    shots: {},
    shootDays: [],
    recent: [],
    casting: {},
    gear: [],
  };
}

/** Fyller i fält som saknas (äldre sparade versioner). */
export function normalizeProject(p: Partial<ProjectData> & { id: string }): ProjectData {
  const base = createProject({ title: '', subtitle: '', format: 'Kortfilm', template: 'empty' }, p.createdAt ?? Date.now());
  return { ...base, ...p, id: p.id, casting: p.casting ?? {}, gear: p.gear ?? [] };
}

// ---------------------------------------------------------------------------
// Lokal lagring — projekt

const STORAGE_KEY = 'aplus.projects.v1';

export interface StoredState {
  version: 1;
  projects: ProjectData[];
  activeProjectId: string | null;
}

function isStored(d: unknown): d is StoredState {
  if (!d || typeof d !== 'object') return false;
  const s = d as { version?: unknown; projects?: unknown };
  return (
    s.version === 1 &&
    Array.isArray(s.projects) &&
    s.projects.every(
      (p: unknown) =>
        !!p && typeof p === 'object' && typeof (p as { id?: unknown }).id === 'string' && typeof (p as { script?: unknown }).script === 'string',
    )
  );
}

export function loadStored(): StoredState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!isStored(data)) return null;
    const projects = data.projects.map((p) => normalizeProject(p));
    const active = projects.some((p) => p.id === data.activeProjectId) ? data.activeProjectId : projects[0]?.id ?? null;
    return { version: 1, projects, activeProjectId: active };
  } catch {
    return null;
  }
}

export function saveStored(state: StoredState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Lokal lagring — personliga inställningar (tema, skrivstil). Delas mellan alla projekt.

const SETTINGS_KEY = 'aplus.settings.v1';

export const DEFAULT_SETTINGS: Settings = { theme: 'dark', headingStyle: 'dash' };

function isTheme(v: unknown): v is Theme {
  return v === 'dark' || v === 'light';
}

function isHeadingStyle(v: unknown): v is HeadingStyle {
  return v === 'dash' || v === 'period';
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: isTheme(data.theme) ? data.theme : DEFAULT_SETTINGS.theme,
      headingStyle: isHeadingStyle(data.headingStyle) ? data.headingStyle : DEFAULT_SETTINGS.headingStyle,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ingen lagring tillgänglig — inställningarna gäller bara den här sessionen.
  }
}

// ---------------------------------------------------------------------------
// Tid

const pad = (n: number) => String(n).padStart(2, '0');

export function clockTime(at: number): string {
  const d = new Date(at);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relativeTime(at: number, now = Date.now()): string {
  const diff = Math.max(0, now - at);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'nyss';
  if (min < 60) return `${min} min sedan`;
  const d = new Date(at);
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `${Math.floor(min / 60)} tim sedan`;
  if (d.toDateString() === yesterday.toDateString()) return `i går ${clockTime(at)}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS = ['SÖN', 'MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR'];

export function weekdayOf(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : WEEKDAYS[d.getDay()];
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
