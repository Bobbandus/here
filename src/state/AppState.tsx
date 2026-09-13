import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type {
  AiKind,
  AppId,
  AppScene,
  BibleNote,
  CastCandidate,
  CastingEntry,
  Character,
  GearItem,
  HeadingStyle,
  LineType,
  Location,
  ParsedLine,
  PipelineStage,
  ProjectData,
  SceneMeta,
  Shot,
  ShootDay,
  Status,
  Theme,
  ViewId,
} from '../types';
import { classifyLines, extractSceneRanges, parseHeading, sceneIdFor, type LineOverrides } from '../fountain/parse';
import type { CharacterStat } from '../fountain/autocomplete';
import { createDemoProject, DEMO_PROJECT_ID } from '../data/project';
import { lensGear } from '../components/plan/shots';
import { CHARACTER_COLORS, clockTime, createProject, loadSettings, loadStored, saveSettings, saveStored, uid } from './projects';
import { appOfView } from './views';

export type BibleTab = 'characters' | 'locations' | 'notes';
export type Zoom = 90 | 100 | 110;

export interface CursorInfo {
  line: number;
  col: number;
  type: LineType;
  sceneId: string | null;
}

export interface UiState {
  app: AppId;
  view: ViewId;
  lastView: Record<Exclude<AppId, 'home'>, ViewId>;
  selectedSceneId: string;
  selectedCharacter: string | null;
  cursor: CursorInfo;
  jump: { line: number; nonce: number } | null;
  leftOpen: boolean;
  rightOpen: boolean;
  bibleTab: BibleTab;
  zoom: Zoom;
  pageBreaks: boolean;
  paletteOpen: boolean;
  newProjectOpen: boolean;
  settingsOpen: boolean;
  focusMode: boolean;
  toast: { id: number; message: string } | null;
  ai: AiKind | null;
  theme: Theme;
  headingStyle: HeadingStyle;
}

interface RootState {
  ui: UiState;
  projects: ProjectData[];
  activeProjectId: string | null;
}

/** Platt vy som komponenterna läser: UI-state + aktivt projekts fält. */
export interface AppState extends UiState {
  hasProject: boolean;
  project: ProjectData;
  projects: ProjectData[];
  script: string;
  overrides: Record<number, LineType>;
  sceneMeta: Record<string, SceneMeta>;
  characters: Character[];
  locations: Location[];
  notes: BibleNote[];
  shots: Record<string, Shot[]>;
  shootDays: ShootDay[];
  gear: GearItem[];
  lastEdited: string;
}

export type ProjectInfoPatch = Partial<Pick<ProjectData, 'title' | 'subtitle' | 'format' | 'draft'>>;

export type Action =
  // Appar, vyer, projekt
  | { type: 'SET_APP'; app: AppId }
  | { type: 'SET_VIEW'; view: ViewId }
  | { type: 'OPEN_PROJECT'; id: string; app: Exclude<AppId, 'home'> }
  | { type: 'SELECT_PROJECT'; id: string }
  | { type: 'CREATE_PROJECT'; project: ProjectData }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'UPDATE_PROJECT_INFO'; patch: ProjectInfoPatch }
  | { type: 'RESET_DEMO' }
  | { type: 'SET_NEW_PROJECT_OPEN'; open: boolean }
  // Inställningar
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'SET_HEADING_STYLE'; style: HeadingStyle }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_FOCUS_MODE'; on: boolean }
  // Editor
  | { type: 'EDIT'; script: string; overrides: Record<number, LineType>; sceneId: string | null }
  | { type: 'SET_CURSOR'; cursor: CursorInfo }
  | { type: 'JUMP'; line: number }
  | { type: 'SELECT_SCENE'; sceneId: string }
  | { type: 'TOGGLE_LEFT' }
  | { type: 'TOGGLE_RIGHT' }
  | { type: 'SET_RIGHT'; open: boolean }
  | { type: 'SET_BIBLE_TAB'; tab: BibleTab }
  | { type: 'SET_ZOOM'; zoom: Zoom }
  | { type: 'TOGGLE_PAGE_BREAKS' }
  // Skal
  | { type: 'SET_PALETTE'; open: boolean }
  | { type: 'TOAST'; message: string }
  | { type: 'CLEAR_TOAST'; id: number }
  | { type: 'OPEN_AI'; kind: AiKind }
  | { type: 'CLOSE_AI' }
  // Projektdata
  | { type: 'CYCLE_STATUS'; sceneId: string; stage: PipelineStage }
  | { type: 'UPDATE_PRODUCTION'; sceneId: string; patch: Partial<SceneMeta['production']> }
  | { type: 'ADD_CHARACTER' }
  | { type: 'UPDATE_CHARACTER'; id: string; patch: Partial<Character> }
  | { type: 'DELETE_CHARACTER'; id: string }
  | { type: 'ADD_LOCATION' }
  | { type: 'UPDATE_LOCATION'; id: string; patch: Partial<Location> }
  | { type: 'DELETE_LOCATION'; id: string }
  | { type: 'ADD_NOTE' }
  | { type: 'UPDATE_NOTE'; id: string; patch: Partial<BibleNote> }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'ADD_SHOT'; sceneId: string; shot?: Partial<Omit<Shot, 'id'>> }
  | { type: 'UPDATE_SHOT'; sceneId: string; id: string; patch: Partial<Shot> }
  | { type: 'DELETE_SHOT'; sceneId: string; id: string }
  | { type: 'MOVE_SHOT'; sceneId: string; id: string; dir: -1 | 1 }
  | { type: 'ADD_DAY'; day: Omit<ShootDay, 'id'> }
  | { type: 'UPDATE_DAY'; id: string; patch: Partial<ShootDay> }
  | { type: 'DELETE_DAY'; id: string }
  // Casting
  | { type: 'SELECT_CHARACTER'; name: string }
  | { type: 'ADD_REF_IMAGE'; character: string; dataUrl: string }
  | { type: 'REMOVE_REF_IMAGE'; character: string; index: number }
  | { type: 'ADD_CANDIDATE'; character: string }
  | { type: 'UPDATE_CANDIDATE'; character: string; id: string; patch: Partial<Omit<CastCandidate, 'id'>> }
  | { type: 'DELETE_CANDIDATE'; character: string; id: string }
  | { type: 'SET_CHOSEN_CANDIDATE'; character: string; id: string }
  // Utrustning
  | { type: 'ADD_GEAR' }
  | { type: 'UPDATE_GEAR'; id: string; patch: Partial<Omit<GearItem, 'id'>> }
  | { type: 'DELETE_GEAR'; id: string };

export const STATUS_CYCLE: Status[] = ['todo', 'active', 'done', 'blocked'];

export const emptyMeta = (): SceneMeta => ({
  pipeline: { write: 'todo', prepro: 'todo', production: 'todo', post: 'todo' },
  production: {
    props: [],
    cast: {},
    lens_id: null,
    mic_id: null,
    notes: '',
    sensor: 'Super 35 · 24.89 mm',
    mic_placement: 'Bom ovanifrån',
    channel: 'CH1',
  },
});

const emptyCasting = (): CastingEntry => ({ referenceImages: [], candidates: [] });

const initialCursor: CursorInfo = { line: 0, col: 0, type: 'action', sceneId: null };

const projectUiReset: Partial<UiState> = {
  selectedSceneId: 'SC-001',
  selectedCharacter: null,
  cursor: initialCursor,
  jump: null,
  ai: null,
  focusMode: false,
};

function buildInitialUi(): UiState {
  const settings = loadSettings();
  return {
    app: 'home',
    view: 'write',
    lastView: { write: 'write', plan: 'plan-overview', shoot: 'shoot' },
    selectedSceneId: 'SC-001',
    selectedCharacter: null,
    cursor: initialCursor,
    jump: null,
    leftOpen: true,
    rightOpen: true,
    bibleTab: 'characters',
    zoom: 100,
    pageBreaks: false,
    paletteOpen: false,
    newProjectOpen: false,
    settingsOpen: false,
    focusMode: false,
    toast: null,
    ai: null,
    theme: settings.theme,
    headingStyle: settings.headingStyle,
  };
}

function initRoot(): RootState {
  const ui = buildInitialUi();
  const stored = loadStored();
  if (stored) return { ui, projects: stored.projects, activeProjectId: stored.activeProjectId };
  const demo = createDemoProject();
  return { ui, projects: [demo], activeProjectId: demo.id };
}

let toastSeq = 1;
let jumpSeq = 1;

const ui = (root: RootState, patch: Partial<UiState>): RootState => ({ ...root, ui: { ...root.ui, ...patch } });

function updateActive(root: RootState, fn: (p: ProjectData) => ProjectData): RootState {
  if (!root.activeProjectId) return root;
  return {
    ...root,
    projects: root.projects.map((p) => (p.id === root.activeProjectId ? { ...fn(p), updatedAt: Date.now() } : p)),
  };
}

function updateMeta(p: ProjectData, sceneId: string, fn: (m: SceneMeta) => SceneMeta): ProjectData {
  return { ...p, sceneMeta: { ...p.sceneMeta, [sceneId]: fn(p.sceneMeta[sceneId] ?? emptyMeta()) } };
}

function updateShots(p: ProjectData, sceneId: string, fn: (s: Shot[]) => Shot[]): ProjectData {
  return { ...p, shots: { ...p.shots, [sceneId]: fn(p.shots[sceneId] ?? []) } };
}

function updateCasting(p: ProjectData, character: string, fn: (c: CastingEntry) => CastingEntry): ProjectData {
  return { ...p, casting: { ...p.casting, [character]: fn(p.casting[character] ?? emptyCasting()) } };
}

function reducer(root: RootState, action: Action): RootState {
  switch (action.type) {
    case 'SET_APP': {
      if (action.app === 'home') return ui(root, { app: 'home', ai: null, paletteOpen: false, focusMode: false });
      if (!root.activeProjectId) return ui(root, { app: 'home', newProjectOpen: true });
      return ui(root, { app: action.app, view: root.ui.lastView[action.app], ai: null });
    }
    case 'SET_VIEW': {
      const app = appOfView(action.view);
      const keepAi = action.view === 'scene' || action.view === 'shots';
      return ui(root, {
        app,
        view: action.view,
        lastView: { ...root.ui.lastView, [app]: action.view },
        ai: keepAi ? root.ui.ai : null,
        focusMode: action.view === 'write' ? root.ui.focusMode : false,
      });
    }
    case 'SELECT_PROJECT':
      if (action.id === root.activeProjectId) return root;
      return { ...ui(root, projectUiReset), activeProjectId: action.id };
    case 'OPEN_PROJECT': {
      const switched = action.id !== root.activeProjectId;
      const base = switched ? ui(root, projectUiReset) : root;
      return {
        ...ui(base, { app: action.app, view: base.ui.lastView[action.app], ai: null }),
        activeProjectId: action.id,
      };
    }
    case 'CREATE_PROJECT':
      return {
        ...ui(root, {
          ...projectUiReset,
          app: 'write',
          view: 'write',
          lastView: { write: 'write', plan: 'plan-overview', shoot: 'shoot' },
          newProjectOpen: false,
        }),
        projects: [action.project, ...root.projects],
        activeProjectId: action.project.id,
      };
    case 'DELETE_PROJECT': {
      const projects = root.projects.filter((p) => p.id !== action.id);
      if (action.id !== root.activeProjectId) return { ...root, projects };
      return {
        ...ui(root, { ...projectUiReset, app: 'home' }),
        projects,
        activeProjectId: projects[0]?.id ?? null,
      };
    }
    case 'UPDATE_PROJECT_INFO':
      return updateActive(root, (p) => ({ ...p, ...action.patch }));
    case 'RESET_DEMO': {
      const demo = createDemoProject();
      const exists = root.projects.some((p) => p.id === DEMO_PROJECT_ID);
      const projects = exists ? root.projects.map((p) => (p.id === DEMO_PROJECT_ID ? demo : p)) : [demo, ...root.projects];
      const base = root.activeProjectId === DEMO_PROJECT_ID ? ui(root, projectUiReset) : root;
      return { ...base, projects, activeProjectId: root.activeProjectId ?? demo.id };
    }
    case 'SET_NEW_PROJECT_OPEN':
      return ui(root, { newProjectOpen: action.open, paletteOpen: false, app: action.open ? 'home' : root.ui.app });

    case 'SET_THEME':
      return ui(root, { theme: action.theme });
    case 'SET_HEADING_STYLE':
      return ui(root, { headingStyle: action.style });
    case 'SET_SETTINGS_OPEN':
      return ui(root, { settingsOpen: action.open });
    case 'SET_FOCUS_MODE':
      return ui(root, { focusMode: action.on });

    case 'EDIT': {
      const now = Date.now();
      return updateActive(root, (p) => ({
        ...p,
        script: action.script,
        overrides: action.overrides,
        recent: action.sceneId
          ? [{ sceneId: action.sceneId, at: now }, ...p.recent.filter((r) => r.sceneId !== action.sceneId)].slice(0, 8)
          : p.recent,
      }));
    }
    case 'SET_CURSOR':
      return ui(root, {
        cursor: action.cursor,
        selectedSceneId: action.cursor.sceneId ?? root.ui.selectedSceneId,
      });
    case 'JUMP':
      return ui(root, { jump: { line: action.line, nonce: jumpSeq++ } });
    case 'SELECT_SCENE':
      return ui(root, { selectedSceneId: action.sceneId });
    case 'TOGGLE_LEFT':
      return ui(root, { leftOpen: !root.ui.leftOpen });
    case 'TOGGLE_RIGHT':
      return ui(root, { rightOpen: !root.ui.rightOpen });
    case 'SET_RIGHT':
      return ui(root, { rightOpen: action.open });
    case 'SET_BIBLE_TAB':
      return ui(root, { bibleTab: action.tab });
    case 'SET_ZOOM':
      return ui(root, { zoom: action.zoom });
    case 'TOGGLE_PAGE_BREAKS':
      return ui(root, { pageBreaks: !root.ui.pageBreaks });

    case 'SET_PALETTE':
      return ui(root, { paletteOpen: action.open });
    case 'TOAST':
      return ui(root, { toast: { id: toastSeq++, message: action.message } });
    case 'CLEAR_TOAST':
      return root.ui.toast?.id === action.id ? ui(root, { toast: null }) : root;
    case 'OPEN_AI':
      return ui(root, { ai: action.kind });
    case 'CLOSE_AI':
      return ui(root, { ai: null });

    case 'CYCLE_STATUS':
      return updateActive(root, (p) =>
        updateMeta(p, action.sceneId, (m) => {
          const cur = m.pipeline[action.stage];
          const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
          return { ...m, pipeline: { ...m.pipeline, [action.stage]: next } };
        }),
      );
    case 'UPDATE_PRODUCTION':
      return updateActive(root, (p) =>
        updateMeta(p, action.sceneId, (m) => ({ ...m, production: { ...m.production, ...action.patch } })),
      );

    case 'ADD_CHARACTER': {
      const name = 'NY KARAKTÄR';
      return updateActive(root, (p) => ({
        ...p,
        characters: [
          ...p.characters,
          {
            id: uid('CH'),
            name,
            age: '',
            description: '',
            color: CHARACTER_COLORS[p.characters.length % CHARACTER_COLORS.length],
          },
        ],
        // Autogenererar en tom castingpost (referensbilder + kandidater) direkt,
        // så rollen redan finns i Plan → Casting utan extra steg.
        casting: { ...p.casting, [name]: p.casting[name] ?? emptyCasting() },
      }));
    }
    case 'UPDATE_CHARACTER':
      return updateActive(root, (p) => {
        const before = p.characters.find((c) => c.id === action.id);
        const characters = p.characters.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c));
        const newName = action.patch.name;
        // Följer med om rollen byter namn, så castingposten inte blir övergiven.
        if (!before || newName === undefined || newName === before.name || newName in p.casting) {
          return { ...p, characters };
        }
        const entry = p.casting[before.name];
        if (!entry) return { ...p, characters };
        const casting = { ...p.casting, [newName]: entry };
        delete casting[before.name];
        return { ...p, characters, casting };
      });
    case 'DELETE_CHARACTER':
      return updateActive(root, (p) => {
        const target = p.characters.find((c) => c.id === action.id);
        if (!target) return p;
        const casting = { ...p.casting };
        delete casting[target.name];
        return { ...p, characters: p.characters.filter((c) => c.id !== action.id), casting };
      });
    case 'ADD_LOCATION':
      return updateActive(root, (p) => ({
        ...p,
        locations: [...p.locations, { id: uid('LOC'), name: 'NY PLATS', int_ext: 'INT', description: '' }],
      }));
    case 'UPDATE_LOCATION':
      return updateActive(root, (p) => ({
        ...p,
        locations: p.locations.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l)),
      }));
    case 'DELETE_LOCATION':
      return updateActive(root, (p) => ({ ...p, locations: p.locations.filter((l) => l.id !== action.id) }));
    case 'ADD_NOTE':
      return updateActive(root, (p) => ({
        ...p,
        notes: [{ id: uid('NOTE'), title: 'Ny anteckning', body: '' }, ...p.notes],
      }));
    case 'UPDATE_NOTE':
      return updateActive(root, (p) => ({
        ...p,
        notes: p.notes.map((n) => (n.id === action.id ? { ...n, ...action.patch } : n)),
      }));
    case 'DELETE_NOTE':
      return updateActive(root, (p) => ({ ...p, notes: p.notes.filter((n) => n.id !== action.id) }));

    case 'ADD_SHOT':
      return updateActive(root, (p) =>
        updateShots(p, action.sceneId, (list) => {
          const prev = list[list.length - 1];
          const lensId = prev?.lensId ?? p.sceneMeta[action.sceneId]?.production.lens_id ?? null;
          const lens = lensGear(p.gear).find((l) => l.id === lensId);
          const focalMm = lens ? (prev?.lensId === lensId ? (prev.focalMm ?? lens.focalMin) : lens.focalMin) : null;
          return [
            ...list,
            {
              id: uid('SHT'),
              type: 'MS',
              lensId,
              focalMm,
              movement: 'Statisk',
              description: '',
              durationSec: 10,
              done: false,
              ...action.shot,
            },
          ];
        }),
      );
    case 'UPDATE_SHOT':
      return updateActive(root, (p) =>
        updateShots(p, action.sceneId, (list) => list.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s))),
      );
    case 'DELETE_SHOT':
      return updateActive(root, (p) => updateShots(p, action.sceneId, (list) => list.filter((s) => s.id !== action.id)));
    case 'MOVE_SHOT':
      return updateActive(root, (p) =>
        updateShots(p, action.sceneId, (list) => {
          const i = list.findIndex((s) => s.id === action.id);
          const j = i + action.dir;
          if (i < 0 || j < 0 || j >= list.length) return list;
          const next = [...list];
          [next[i], next[j]] = [next[j], next[i]];
          return next;
        }),
      );

    case 'ADD_DAY':
      return updateActive(root, (p) => ({
        ...p,
        shootDays: [...p.shootDays, { ...action.day, id: uid('DAY') }].sort((a, b) => a.date.localeCompare(b.date)),
      }));
    case 'UPDATE_DAY':
      return updateActive(root, (p) => ({
        ...p,
        shootDays: p.shootDays
          .map((d) => (d.id === action.id ? { ...d, ...action.patch } : d))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }));
    case 'DELETE_DAY':
      return updateActive(root, (p) => ({ ...p, shootDays: p.shootDays.filter((d) => d.id !== action.id) }));

    case 'SELECT_CHARACTER':
      return ui(root, { selectedCharacter: action.name });
    case 'ADD_REF_IMAGE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({ ...c, referenceImages: [...c.referenceImages, action.dataUrl] })),
      );
    case 'REMOVE_REF_IMAGE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({
          ...c,
          referenceImages: c.referenceImages.filter((_, i) => i !== action.index),
        })),
      );
    case 'ADD_CANDIDATE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({
          ...c,
          candidates: [...c.candidates, { id: uid('CAND'), name: 'Ny kandidat', photo: null, notes: '', chosen: false }],
        })),
      );
    case 'UPDATE_CANDIDATE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({
          ...c,
          candidates: c.candidates.map((cand) => (cand.id === action.id ? { ...cand, ...action.patch } : cand)),
        })),
      );
    case 'DELETE_CANDIDATE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({ ...c, candidates: c.candidates.filter((cand) => cand.id !== action.id) })),
      );
    case 'SET_CHOSEN_CANDIDATE':
      return updateActive(root, (p) =>
        updateCasting(p, action.character, (c) => ({
          ...c,
          candidates: c.candidates.map((cand) => ({ ...cand, chosen: cand.id === action.id ? !cand.chosen : false })),
        })),
      );

    case 'ADD_GEAR':
      return updateActive(root, (p) => ({
        ...p,
        gear: [
          ...p.gear,
          { id: uid('GEAR'), name: 'Ny utrustning', category: 'Övrigt', location: '', status: 'Tillgänglig', assignedTo: '', notes: '' },
        ],
      }));
    case 'UPDATE_GEAR':
      return updateActive(root, (p) => ({ ...p, gear: p.gear.map((g) => (g.id === action.id ? { ...g, ...action.patch } : g)) }));
    case 'DELETE_GEAR':
      return updateActive(root, (p) => ({ ...p, gear: p.gear.filter((g) => g.id !== action.id) }));

    default:
      return root;
  }
}

// ---------------------------------------------------------------------------
// Härledd data

export interface Todo {
  id: string;
  sceneId: string;
  text: string;
  severity: 'flare' | 'gold';
}

export interface Derived {
  lines: ParsedLine[];
  scenes: AppScene[];
  textSceneCount: number;
  totalPages: number;
  runtimeMin: number;
  characterCount: number;
  /**
   * Repliker per karaktär, för autocomplete och story bible-statistik.
   * Omfattar ALLA namn som förekommer i manuset — inte bara de som lagts
   * till i story bible — så autocomplete lär sig nya karaktärer direkt.
   */
  characterStats: CharacterStat[];
  /** Scener och repliker per karaktär i hela projektet (story bible). */
  characterTotals: Record<string, { scenes: number; lines: number }>;
  sceneById: Record<string, AppScene>;
  shotCount: number;
  todos: Todo[];
}

export function derive(project: ProjectData): Derived {
  const lines = classifyLines(project.script, { overrides: project.overrides as LineOverrides });
  const ranges = extractSceneRanges(lines);
  const metaFor = (id: string): SceneMeta => project.sceneMeta[id] ?? emptyMeta();

  const scenes: AppScene[] = ranges.map((r) => {
    const meta = metaFor(r.scene.scene_id);
    return {
      ...r.scene,
      pipeline: meta.pipeline,
      production: meta.production,
      hasText: true,
      headingLine: r.headingLine,
      endLine: r.endLine,
    };
  });

  project.ghostScenes.forEach((gs, i) => {
    const id = sceneIdFor(ranges.length + i + 1);
    const meta = metaFor(id);
    scenes.push({
      scene_id: id,
      scene_heading: gs.heading,
      ...parseHeading(gs.heading),
      characters_present: gs.characters,
      action_lines: [],
      dialogue: [],
      page_length: gs.pages,
      pipeline: meta.pipeline,
      production: meta.production,
      hasText: false,
      headingLine: null,
      endLine: null,
    });
  });

  const docLines: Record<string, number> = {};
  const totals: Record<string, { scenes: number; lines: number }> = {};
  const names = new Set<string>();

  for (const s of scenes) {
    const perScene: Record<string, number> = {};
    if (s.hasText) {
      for (const d of s.dialogue) {
        if (!d.character) continue;
        perScene[d.character] = (perScene[d.character] ?? 0) + 1;
        docLines[d.character] = (docLines[d.character] ?? 0) + 1;
      }
    } else {
      const est = Math.max(2, Math.round((s.page_length * 12) / Math.max(1, s.characters_present.length)));
      for (const c of s.characters_present) perScene[c] = est;
    }
    for (const c of s.characters_present) {
      names.add(c);
      const t = (totals[c] ??= { scenes: 0, lines: 0 });
      t.scenes += 1;
      t.lines += perScene[c] ?? 0;
    }
  }
  // Story bible-karaktärer som (ännu) inte förekommer i manuset ska också kunna
  // autokompletteras och visas med 0 repliker.
  for (const c of project.characters) names.add(c.name.toUpperCase());

  const characterStats: CharacterStat[] = [...names].map((name) => ({ name, lines: docLines[name] ?? 0 }));

  const totalPages = scenes.reduce((a, s) => a + s.page_length, 0);
  const sceneById: Record<string, AppScene> = {};
  for (const s of scenes) sceneById[s.scene_id] = s;

  // Öppna produktionspunkter för scener som lämnat skrivfasen.
  const todos: Todo[] = [];
  const stageName: Record<PipelineStage, string> = { write: 'skriv', prepro: 'pre-pro', production: 'produktion', post: 'post' };
  for (const s of scenes) {
    const stages = Object.keys(s.pipeline) as PipelineStage[];
    for (const st of stages) {
      if (s.pipeline[st] === 'blocked') {
        todos.push({ id: `${s.scene_id}-blk-${st}`, sceneId: s.scene_id, text: `${s.scene_id} blockerad i ${stageName[st]}`, severity: 'flare' });
      }
    }
    if (s.pipeline.prepro === 'todo' && s.pipeline.production === 'todo') continue;
    for (const c of s.characters_present) {
      if (!s.production.cast[c]) {
        todos.push({ id: `${s.scene_id}-cast-${c}`, sceneId: s.scene_id, text: `${s.scene_id} saknar cast för rollen ${c}`, severity: 'flare' });
      }
    }
    if (!s.production.lens_id) {
      todos.push({ id: `${s.scene_id}-lens`, sceneId: s.scene_id, text: `${s.scene_id} saknar linsval`, severity: 'gold' });
    }
    if (!(project.shots[s.scene_id]?.length)) {
      todos.push({ id: `${s.scene_id}-shots`, sceneId: s.scene_id, text: `${s.scene_id} saknar shotlista`, severity: 'gold' });
    }
  }
  todos.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'flare' ? -1 : 1));

  return {
    lines,
    scenes,
    textSceneCount: ranges.length,
    totalPages,
    runtimeMin: Math.round(totalPages),
    characterCount: names.size,
    characterStats,
    characterTotals: totals,
    sceneById,
    shotCount: Object.values(project.shots).reduce((a, l) => a + l.length, 0),
    todos,
  };
}

// ---------------------------------------------------------------------------

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  derived: Derived;
  /** Navigera till scen i A+ Write (skrivvyn) eller A+ Plan (scen/shotlista). */
  goToScene: (sceneId: string, target?: 'write' | 'scene' | 'shots') => void;
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [root, dispatch] = useReducer(reducer, undefined, initRoot);
  const fallback = useMemo(() => createProject({ title: '', subtitle: '', format: 'Kortfilm', template: 'empty' }), []);
  const active = root.projects.find((p) => p.id === root.activeProjectId) ?? null;
  const project = active ?? fallback;

  // Spara lokalt (debounce). Ingen molnsynk.
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveStored({ version: 1, projects: root.projects, activeProjectId: root.activeProjectId });
    }, 400);
    return () => window.clearTimeout(t);
  }, [root.projects, root.activeProjectId]);

  // Personliga inställningar (tema, skrivstil) — separat lagring, delas mellan projekt.
  useEffect(() => {
    saveSettings({ theme: root.ui.theme, headingStyle: root.ui.headingStyle });
  }, [root.ui.theme, root.ui.headingStyle]);

  useEffect(() => {
    document.documentElement.dataset.theme = root.ui.theme;
  }, [root.ui.theme]);

  const derived = useMemo(
    () => derive(project),
    // Endast fält som påverkar härledd data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project.script, project.overrides, project.sceneMeta, project.characters, project.ghostScenes, project.shots],
  );

  const state: AppState = useMemo(
    () => ({
      ...root.ui,
      hasProject: active !== null,
      project,
      projects: root.projects,
      script: project.script,
      overrides: project.overrides,
      sceneMeta: project.sceneMeta,
      characters: project.characters,
      locations: project.locations,
      notes: project.notes,
      shots: project.shots,
      shootDays: project.shootDays,
      gear: project.gear,
      lastEdited: clockTime(project.updatedAt),
    }),
    [root.ui, root.projects, project, active],
  );

  const goToScene = useCallback(
    (sceneId: string, target: 'write' | 'scene' | 'shots' = 'write') => {
      const scene = derived.sceneById[sceneId];
      if (!scene) return;
      dispatch({ type: 'SELECT_SCENE', sceneId });
      if (target === 'write' && scene.hasText && scene.headingLine !== null) {
        dispatch({ type: 'SET_VIEW', view: 'write' });
        dispatch({ type: 'JUMP', line: scene.headingLine });
      } else {
        dispatch({ type: 'SET_VIEW', view: target === 'shots' ? 'shots' : 'scene' });
      }
    },
    [derived],
  );

  const value = useMemo(() => ({ state, dispatch, derived, goToScene }), [state, derived, goToScene]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp måste användas inom AppStateProvider');
  return ctx;
}
