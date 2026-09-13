// Delade typer för A+ (Write + Plan). Inga runtime-beroenden.

export type LineType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'centered'
  | 'note'
  | 'section'
  | 'synopsis'
  | 'empty';

export interface ParsedLine {
  index: number;
  lineId: string;
  /** Rå text exakt som i dokumentet (utan radbrytning). */
  raw: string;
  /** Text utan tvingande markörer (`.`, `@`, `>` …). */
  text: string;
  type: LineType;
  /** Typen kommer från markör i texten eller editorns tvingade typ. */
  forced: boolean;
  /** Antal tecken markör i början respektive slutet av raden. */
  markerPrefix: number;
  markerSuffix: number;
  /** Teckenposition i hela dokumentet där raden börjar. */
  offset: number;
}

export type Status = 'todo' | 'active' | 'done' | 'blocked';

export type PipelineStage = 'write' | 'prepro' | 'production' | 'post';

export type IntExt = 'INT' | 'EXT' | 'INT/EXT' | 'EST' | null;

export interface SceneProduction {
  props: string[];
  cast: Record<string, string>;
  lens_id: string | null;
  mic_id: string | null;
  notes: string;
}

export interface Scene {
  scene_id: string;
  scene_heading: string;
  int_ext: IntExt;
  location: string;
  time_of_day: string | null;
  characters_present: string[];
  action_lines: { line_id: string; text: string }[];
  dialogue: { line_id: string; character: string; text: string }[];
  page_length: number;
  pipeline: Record<PipelineStage, Status>;
  production: SceneProduction;
}

/** Scen i appen: parsad eller metadata-only, med radintervall om den har text. */
export interface AppScene extends Scene {
  hasText: boolean;
  /** Index för scenrubrikens rad i dokumentet (null för metadata-scener). */
  headingLine: number | null;
  endLine: number | null;
}

export interface SceneMeta {
  pipeline: Record<PipelineStage, Status>;
  production: SceneProduction & { sensor: string; mic_placement: string; channel: string };
}

export interface Character {
  id: string;
  name: string;
  age: string;
  description: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
  int_ext: Exclude<IntExt, null>;
  description: string;
}

export interface BibleNote {
  id: string;
  title: string;
  body: string;
}

export interface Microphone {
  id: string;
  label: string;
  type: string;
}

export type PropSource = 'PRINTPROFFSEN' | 'LAGER';

export interface PropItem {
  id: string;
  name: string;
  source: PropSource;
  method: string;
}

export interface CastMember {
  id: string;
  name: string;
  note: string;
}

export interface ShootDay {
  id: string;
  /** ISO-datum, YYYY-MM-DD. */
  date: string;
  location: string;
  sceneIds: string[];
  call: string;
}

export type ShotType =
  | 'EST'
  | 'WS'
  | 'MASTER'
  | 'MS'
  | 'MCU'
  | 'CU'
  | 'ECU'
  | '2-SHOT'
  | 'GROUP'
  | 'OTS'
  | 'POV'
  | 'INSERT'
  | 'CUTAWAY';

export interface Shot {
  id: string;
  type: ShotType;
  lensId: string | null;
  /**
   * Vald brännvidd i mm för just den här tagningen. Behövs eftersom ett
   * zoomobjektiv (t.ex. 12–42 mm) täcker ett intervall — man väljer alltså
   * vilken brännvidd som faktiskt användes, till skillnad från ett fast
   * objektiv (prime) där brännvidden alltid är densamma. `null` = inget
   * objektiv valt.
   */
  focalMm: number | null;
  movement: string;
  description: string;
  durationSec: number;
  done: boolean;
}

/** Scen som bara finns som metadata (utan manustext). */
export interface GhostScene {
  heading: string;
  characters: string[];
  pages: number;
}

export type ProjectFormat = 'Långfilm' | 'Kortfilm' | 'Serieavsnitt' | 'Reklamfilm' | 'Musikvideo';

// ---------------------------------------------------------------------------
// Casting

/** En möjlig skådespelare för en roll. */
export interface CastCandidate {
  id: string;
  name: string;
  /** Nedskalad data-URL (JPEG), eller null utan bild. */
  photo: string | null;
  notes: string;
  chosen: boolean;
}

export interface CastingEntry {
  /** Referensbilder för hur rollen ska se ut, som data-URLer. */
  referenceImages: string[];
  candidates: CastCandidate[];
}

// ---------------------------------------------------------------------------
// Utrustning

export type GearCategory = 'Kamera' | 'Objektiv' | 'Ljud' | 'Ljus' | 'Grip' | 'Övrigt';
export type GearStatus = 'Tillgänglig' | 'Utlånad' | 'Service';

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  location: string;
  status: GearStatus;
  assignedTo: string;
  notes: string;
  /**
   * Objektivdata — sätts bara när `category` är "Objektiv". `focalMin === focalMax`
   * betyder ett fast objektiv (prime); annars ett zoomobjektiv med det intervallet.
   * Shotlistan och Scen-panelens kameraval läser objektiv härifrån (gear-listan),
   * inte från någon separat delad linsinventarie.
   */
  focalMin?: number;
  focalMax?: number;
  aperture?: string;
  mount?: string;
}

/** Ett gear-objekt med objektivdata garanterat ifyllt (kategori "Objektiv"). */
export interface LensGearItem extends GearItem {
  focalMin: number;
  focalMax: number;
}

// ---------------------------------------------------------------------------

export interface ProjectData {
  id: string;
  title: string;
  subtitle: string;
  format: ProjectFormat;
  studio: string;
  draft: number;
  createdAt: number;
  updatedAt: number;
  script: string;
  overrides: Record<number, LineType>;
  sceneMeta: Record<string, SceneMeta>;
  characters: Character[];
  locations: Location[];
  notes: BibleNote[];
  ghostScenes: GhostScene[];
  /** Tagningar per scen-ID. */
  shots: Record<string, Shot[]>;
  shootDays: ShootDay[];
  recent: { sceneId: string; at: number }[];
  /** Nyckel: rollnamn i versaler. */
  casting: Record<string, CastingEntry>;
  gear: GearItem[];
}

export type AppId = 'home' | 'write' | 'plan' | 'shoot';

export type ViewId =
  | 'write-overview'
  | 'write'
  | 'plan-overview'
  | 'scene'
  | 'shots'
  | 'days'
  | 'pipeline'
  | 'casting'
  | 'gear'
  | 'shoot';

// ---------------------------------------------------------------------------
// Personliga inställningar (ej per projekt)

export type Theme = 'dark' | 'light';
/** Bindestreck: "EXT. PLATS – DAG". Punkt: "EXT. PLATS. DAG." */
export type HeadingStyle = 'dash' | 'period';

export interface Settings {
  theme: Theme;
  headingStyle: HeadingStyle;
}

export type AiKind = 'synopsis' | 'lens' | 'shotlist' | 'blocking' | 'audio' | 'review';

export interface CreativeItem {
  text: string;
  meta: string;
}

export interface CreativeAiOutput {
  kind: 'creative';
  id: AiKind;
  title: string;
  variants: { label: string; items: CreativeItem[] }[];
}

export interface MeasureRow {
  parameter: string;
  measured: string;
  threshold: string;
  deviation: string | null;
}

export interface MeasureAiOutput {
  kind: 'measure';
  id: AiKind;
  title: string;
  rows: MeasureRow[];
  /** Endast granskningen: alternativt läge utan avvikelser. */
  cleanRows?: MeasureRow[];
}

export type AiOutput = CreativeAiOutput | MeasureAiOutput;
