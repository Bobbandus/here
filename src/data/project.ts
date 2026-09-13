import type { CastingEntry, GearItem, GhostScene, PipelineStage, ProjectData, SceneMeta, Shot, ShootDay, Status } from '../types';
import { sceneIdFor } from '../fountain/parse';
import { bibleNotes, characters, locations } from './storyBible';
import { microphones } from './production';

export const DEMO_PROJECT_ID = 'PRJ-KVAR';
const DEMO_TOTAL_SCENES = 42;

/**
 * Manustext för scen 1–8 i Fountain-format. Editorn parsar den här strängen vid start.
 * Scen 9–42 finns endast som metadata nedan.
 */
export const scriptText = `# AKT ETT

= Maja stannar kvar när alla andra åker.

EXT. BUSSHÅLLPLATSEN – GRYNING

Dimma över fälten. En ensam busskur med trasig reklamtavla. MAJA (17), luvtröja, hörlurar runt halsen, sitter på bänken och räknar mynt.

Bussen kommer. Den saktar in, tvekar och kör vidare.

MAJA
(till sig själv)
Klart den inte stannar.

LEO (17) cyklar in i bild och bromsar med ett gnissel.

LEO
Du vet att den går var fjärde timme, va?

MAJA
Jag vet när den går. Jag vet bara inte om jag vill med.

[[Ljud: bussen ska höras innan den syns. Fältinspelning i gryning, ingen trafik.]]

KLIPP TILL:

INT. KÖKET – MORGON

Radion står på låg volym. PAPPA (50-tal) steker ägg i en för stor stekpanna. Maja kommer in och sätter sig utan att ta av jackan.

PAPPA
Du missade bussen.

MAJA
Den missade mig.

PAPPA
(vänder sig inte om)
Samma sak.

Han ställer en tallrik framför henne. Hon rör den inte.

MAJA
Pappa. Om jag inte söker till Göteborg...

PAPPA
Då gör du inte det.

Tystnad. Äggen fräser.

INT. SKOLKORRIDOREN – DAG

Skåpdörrar slår igen. Elever strömmar förbi. ALICE (17), ny, för välklädd för stället, letar efter ett skåpnummer.

Maja går rakt in i henne. Papper flyger.

Alice
Förlåt! Eller, alltså, det var du som...

Maja
Ja. Det var jag.

Maja plockar upp ett papper. Det är en antagningsblankett. Hon läser namnet.

MAJA (FORTS.)
Alice. Du ska härifrån också.

ALICE
Jag har precis kommit hit.

EXT. PARKERINGEN – NATT

Ett lysrör flimrar. Leos gamla Volvo står ensam på asfalten. Maja och Leo sitter på motorhuven och delar en energidryck.

LEO
Om fem år är det bara du och jag kvar här.

MAJA
Och pappa.

LEO
Och din pappa. Och den där lampan.

Han pekar på lysröret. Det blinkar två gånger och slocknar.

MAJA
(skrattar)
Inte ens den stannar.

Leo tar fram en hopvikt lapp ur jackfickan men stoppar tillbaka den.

[[Blockning: bilen i vidvinkel, lysröret måste synas i bakgrunden hela scenen.]]

INT. BILEN – NATT – FORTSÄTTNING

Regn mot vindrutan. Leo kör. Maja håller lappen, utvikt nu.

MAJA
Det här är en biljett.

LEO
Enkel. Stockholm. Fredag.

MAJA
Du har inte sagt något.

LEO
Jag säger något nu.

Vindrutetorkarna går. Ingen av dem säger något mer.

TONA UT.

.NÅGONSTANS UTANFÖR STADEN – SKYMNING

= Mellanspel. Ingen dialog.

Maja går längs en grusväg. Hon stannar vid en skylt: ALINGSÅS 4. Hon vänder inte om.

> SLUT PÅ AKT ETT <

# AKT TVÅ

INT. KÖKET – KVÄLL

Pappa sitter vid bordet med en hög räkningar. Alice står i dörröppningen, osäker.

ALICE
Maja sa att jag kunde komma förbi.

PAPPA
Maja säger mycket.

@Farmor (O.S.)
Är det flickan från stan?

PAPPA
(ropar)
Hon bor här nu, mamma!

Alice ler för första gången. Pappa ser det och tittar ner i räkningarna igen.

EXT. SKOLGÅRDEN – DAG

Rast. Maja sitter på ett cykelställ. En yngre kille, KALLE (13), ställer sig framför henne och stirrar.

Kalle
Vem är du?

MAJA
Någon som blev kvar.

KALLE
(misstänksam)
Alla blir kvar här.

Maja tittar på honom. Sedan på grinden ut mot vägen. Hon reser sig.

SMASH CUT:
`;

// ---------------------------------------------------------------------------
// Metadata-scener (ingen manustext i utkastet)

const g = (heading: string, characters: string[], pages: number): GhostScene => ({
  heading,
  characters,
  pages,
});

export const ghostScenes: GhostScene[] = [
  g('INT. SKOLKORRIDOREN – DAG', ['MAJA', 'SARA', 'JONNA'], 2.75),
  g('EXT. BUSSHÅLLPLATSEN – DAG', ['MAJA', 'BUSSCHAUFFÖREN'], 1.5),
  g('INT. REKTORNS RUM – DAG', ['MAJA', 'REKTORN'], 3.5),
  g('INT. KÖKET – NATT', ['MAJA', 'PAPPA', 'FARMOR'], 2.75),
  g('EXT. PARKERINGEN – KVÄLL', ['LEO', 'JONNA'], 1.75),
  g('INT. MACKEN – NATT', ['JONNA', 'MAJA', 'ALICE'], 2.75),
  g('EXT. ÄLVSTRANDEN – SKYMNING', ['MAJA', 'ALICE'], 3.25),
  g('INT. BILEN – DAG', ['LEO', 'MAJA'], 2.25),
  g('EXT. BUSSHÅLLPLATSEN – GRYNING', ['MAJA'], 1.25),
  g('INT. SARAS HUS – KVÄLL', ['SARA', 'MAJA', 'LEO', 'ALICE', 'JONNA'], 4),
  g('EXT. SARAS HUS – NATT', ['MAJA', 'ALICE'], 2.75),
  g('INT. KÖKET – MORGON', ['PAPPA', 'TOVE'], 2.75),
  g('EXT. SKOLGÅRDEN – DAG', ['KALLE', 'MAJA', 'REKTORN'], 1.75),
  g('INT. ALICES RUM – KVÄLL', ['ALICE', 'MAJA'], 3.5),
  g('EXT. PARKERINGEN – NATT', ['LEO', 'MAJA', 'ALICE'], 3.5),
  g('INT. BILEN – NATT', ['LEO', 'ALICE'], 2.75),
  g('EXT. JÄRNVÄGSSTATIONEN – GRYNING', ['LEO', 'MAJA'], 3.25),
  g('INT. TOVES LÄGENHET – DAG', ['TOVE', 'MAJA'], 3.5),
  g('INT. KÖKET – KVÄLL', ['PAPPA', 'MAJA', 'FARMOR'], 3.5),
  g('EXT. ÄLVSTRANDEN – NATT', ['MAJA'], 1),
  g('INT. SKOLKORRIDOREN – DAG', ['MAJA', 'ALICE', 'SARA'], 2.25),
  g('INT. AULAN – KVÄLL', ['REKTORN', 'SARA', 'MAJA', 'ALICE'], 3.75),
  g('EXT. SKOLGÅRDEN – KVÄLL', ['KALLE', 'MAJA'], 1.5),
  g('INT. MACKEN – GRYNING', ['JONNA', 'LEO'], 2.75),
  g('EXT. BUSSHÅLLPLATSEN – NATT', ['MAJA', 'ALICE'], 2.75),
  g('INT. FARMORS RUM – NATT', ['FARMOR', 'MAJA'], 3.5),
  g('INT. KÖKET – MORGON', ['PAPPA', 'MAJA'], 2.75),
  g('EXT. LÄNSVÄGEN – DAG', ['MAJA', 'LEO'], 2.25),
  g('INT. BILEN – SKYMNING', ['LEO', 'MAJA'], 3.25),
  g('EXT. JÄRNVÄGSSTATIONEN – DAG', ['LEO', 'MAJA', 'ALICE'], 3.5),
  g('INT. ALICES RUM – NATT', ['ALICE'], 1.25),
  g('EXT. PARKERINGEN – GRYNING', ['MAJA', 'KALLE'], 2.25),
  g('INT. KÖKET – DAG', ['PAPPA', 'MAJA', 'TOVE', 'FARMOR'], 3.25),
  g('EXT. BUSSHÅLLPLATSEN – MORGON', ['MAJA', 'ALICE', 'BUSSCHAUFFÖREN'], 2.75),
];

// ---------------------------------------------------------------------------
// Pipeline- och produktionsdata per scen-ID

const S: Record<string, Status> = { d: 'done', a: 'active', t: 'todo', b: 'blocked' };

/** Fyra tecken: skriv, pre-pro, produktion, post. d=done a=active t=todo b=blocked */
const stageCodes: string[] = [
  'ddda', 'ddat', 'dabt', 'ddat', 'daat', 'dttt', 'datt', 'attt', // SC-001–008 (med text)
  'ddat', 'dddd', 'dbtt', 'ddat', 'datt', 'dddt', 'ddda', 'datt',
  'ddtt', 'dddd', 'datt', 'aatt', 'dbtt', 'ddat', 'dttt', 'attt',
  'ddtt', 'dadt', 'tttt', 'dttt', 'attt', 'ddat', 'dbtt', 'tttt',
  'dttt', 'attt', 'tttt', 'dddt', 'datt', 'tttt', 'attt', 'tttt',
  'dttt', 'tttt',
];

const STAGES: PipelineStage[] = ['write', 'prepro', 'production', 'post'];

function pipelineFrom(code: string): Record<PipelineStage, Status> {
  const out = {} as Record<PipelineStage, Status>;
  STAGES.forEach((stage, i) => {
    out[stage] = S[code[i] ?? 't'] ?? 'todo';
  });
  return out;
}

const productionPreset: Record<number, Partial<SceneMeta['production']>> = {
  1: {
    props: ['Mynt, handfull', 'Hörlurar', 'Busskort'],
    cast: { MAJA: 'CST-1', LEO: 'CST-2' },
    lens_id: 'GEAR-LNS-16',
    mic_id: 'MIC-01',
    mic_placement: 'Bom ovanifrån',
    channel: 'CH1',
    notes: 'Gryningsljus 05:50–06:20. Dimmaskin i reserv.',
  },
  2: {
    props: ['Stekpanna'],
    cast: { MAJA: 'CST-1', PAPPA: 'CST-4' },
    lens_id: 'GEAR-LNS-35',
    mic_id: 'MIC-02',
    mic_placement: 'Bom ovanifrån',
    channel: 'CH1',
  },
  3: {
    props: ['Antagningsblankett'],
    cast: { MAJA: 'CST-1' },
    lens_id: 'GEAR-LNS-24',
    mic_id: 'MIC-03',
    mic_placement: 'Mygg dold under kläder',
    channel: 'CH2',
  },
  4: {
    props: ['Energidryck (fiktivt märke)', 'Lysrörsarmatur', 'Tågbiljett Stockholm'],
    cast: { MAJA: 'CST-1', LEO: 'CST-2' },
    lens_id: null,
    mic_id: 'MIC-01',
    mic_placement: 'Bom underifrån',
    channel: 'CH1',
    notes: 'Tillstånd från kommunen klart. Lysröret styrs från elbilen.',
  },
  5: {
    props: ['Tågbiljett Stockholm'],
    cast: { MAJA: 'CST-1', LEO: 'CST-2' },
    lens_id: 'GEAR-LNS-2470',
    mic_id: 'MIC-03',
    mic_placement: 'Plantmik i scenografi',
    channel: 'CH1+2 (dubbel)',
  },
  6: { props: ['Vägskylt ALINGSÅS 4'], cast: { MAJA: 'CST-1' }, lens_id: 'GEAR-LNS-85' },
  7: {
    props: ['Räkningar i hög'],
    cast: { PAPPA: 'CST-4', FARMOR: 'CST-5' },
    lens_id: 'GEAR-LNS-35',
    mic_id: 'MIC-02',
  },
  8: { props: [], cast: { MAJA: 'CST-1', KALLE: 'CST-6' }, lens_id: null },
  22: { props: ['Lysrörsarmatur'], cast: { LEO: 'CST-2', MAJA: 'CST-1' } },
};

function buildInitialSceneMeta(): Record<string, SceneMeta> {
  const meta: Record<string, SceneMeta> = {};
  for (let n = 1; n <= DEMO_TOTAL_SCENES; n++) {
    const preset = productionPreset[n] ?? {};
    meta[sceneIdFor(n)] = {
      pipeline: pipelineFrom(stageCodes[n - 1] ?? 'tttt'),
      production: {
        props: preset.props ?? [],
        cast: preset.cast ?? {},
        lens_id: preset.lens_id ?? null,
        mic_id: preset.mic_id ?? null,
        notes: preset.notes ?? '',
        sensor: 'Super 35 · 24.89 mm',
        mic_placement: preset.mic_placement ?? 'Bom ovanifrån',
        channel: preset.channel ?? 'CH1',
      },
    };
  }
  return meta;
}

// ---------------------------------------------------------------------------
// Tagningar, inspelningsdagar och historik för exempelprojektet

/**
 * Objektiven finns bara som gear-objekt (kategori "Objektiv") i projektets egen
 * gear-lista — ingen separat delad linsinventarie. `demoGear()` sprider in de
 * här, och `shot()`-hjälparen slår upp fast brännvidd härifrån.
 */
const demoLenses: GearItem[] = [
  { id: 'GEAR-LNS-16', name: '16 mm f/2.8', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 16, focalMax: 16, aperture: 'f/2.8', mount: 'FÄSTE' },
  { id: 'GEAR-LNS-24', name: '24 mm f/1.8', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 24, focalMax: 24, aperture: 'f/1.8', mount: 'FÄSTE' },
  { id: 'GEAR-LNS-35', name: '35 mm f/1.8', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 35, focalMax: 35, aperture: 'f/1.8', mount: 'FÄSTE' },
  { id: 'GEAR-LNS-85', name: '85 mm f/1.8', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 85, focalMax: 85, aperture: 'f/1.8', mount: 'FÄSTE' },
  { id: 'GEAR-LNS-2470', name: '24–70 mm f/2.8', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 24, focalMax: 70, aperture: 'f/2.8', mount: 'FÄSTE' },
  { id: 'GEAR-LNS-1242', name: '12–42 mm f/3.5–5.6', category: 'Objektiv', location: 'Studion, linslåda', status: 'Tillgänglig', assignedTo: '', notes: '', focalMin: 12, focalMax: 42, aperture: 'f/3.5–5.6', mount: 'FÄSTE' },
];

let shotSeq = 0;
const shot = (
  type: Shot['type'],
  lensId: string,
  movement: string,
  description: string,
  durationSec: number,
  done = false,
  focalMm?: number,
): Shot => ({
  id: `SHT-DEMO-${++shotSeq}`,
  type,
  lensId,
  focalMm: focalMm ?? demoLenses.find((l) => l.id === lensId)?.focalMin ?? null,
  movement,
  description,
  durationSec,
  done,
});

function demoShots(): Record<string, Shot[]> {
  shotSeq = 0;
  return {
    'SC-001': [
      shot('WS', 'GEAR-LNS-16', 'Statisk', 'Busskuren i dimman, fälten åt alla håll', 12, true),
      shot('MS', 'GEAR-LNS-35', 'Statisk', 'Maja på bänken räknar mynt', 20, true),
      shot('WS', 'GEAR-LNS-16', 'Pan', 'Bussen saktar in och kör vidare', 9, true),
      shot('2-SHOT', 'GEAR-LNS-35', 'Gimbal', 'Leo bromsar in, samtal på bänken', 45),
    ],
    'SC-002': [
      shot('MS', 'GEAR-LNS-35', 'Statisk', 'Pappa vid spisen, rygg mot Maja', 25),
      shot('CU', 'GEAR-LNS-85', 'Statisk', 'Äggen i stekpannan', 5),
    ],
    'SC-004': [
      shot('WS', 'GEAR-LNS-16', 'Statisk', 'Etablering: bilen ensam under lysröret', 8),
      shot('2-SHOT', 'GEAR-LNS-35', 'Statisk', 'Maja och Leo på motorhuven, framifrån', 40),
      shot('OTS', 'GEAR-LNS-85', 'Statisk', 'Över Leo mot Maja', 25),
      shot('OTS', 'GEAR-LNS-85', 'Statisk', 'Över Maja mot Leo', 25),
      shot('INSERT', 'GEAR-LNS-85', 'Statisk', 'Lysröret blinkar och slocknar', 4),
      // Zoomobjektiv — brännvidden 24 mm vald inom 12–42 mm-intervallet.
      shot('WS', 'GEAR-LNS-1242', 'Handhållen', 'Vidvinkel-reaktion, zoomar in under repliken', 15, false, 24),
    ],
  };
}

function demoCasting(): Record<string, CastingEntry> {
  return {
    MAJA: {
      referenceImages: [],
      candidates: [
        { id: 'CAND-DEMO-1', name: 'Ebba Lindqvist', photo: null, notes: 'Provfilmad 12/9. Bra tystnad, bär scenen utan repliker.', chosen: true },
        { id: 'CAND-DEMO-2', name: 'Wilma Ek', photo: null, notes: 'Stark läsning, men schemakrock med inspelning dag 1.', chosen: false },
      ],
    },
    LEO: {
      referenceImages: [],
      candidates: [{ id: 'CAND-DEMO-3', name: 'Noah Berg', photo: null, notes: 'Cyklar faktiskt, slipper stuntdubbla SC-001.', chosen: true }],
    },
    ALICE: {
      referenceImages: [],
      candidates: [
        { id: 'CAND-DEMO-4', name: 'Selma Karlsson', photo: null, notes: 'Provfilmning bokad.', chosen: false },
        { id: 'CAND-DEMO-5', name: 'Tuva Nord', photo: null, notes: '', chosen: false },
      ],
    },
  };
}

let gearSeq = 0;
const gearItem = (
  name: string,
  category: GearItem['category'],
  location: string,
  status: GearItem['status'] = 'Tillgänglig',
  assignedTo = '',
  notes = '',
): GearItem => ({ id: `GEAR-DEMO-${++gearSeq}`, name, category, location, status, assignedTo, notes });

function demoGear(): GearItem[] {
  gearSeq = 0;
  return [
    gearItem('Sony FX3', 'Kamera', 'Studion, skåp A1', 'Utlånad', 'Jonathan', 'Inspelning t.o.m. 10/10.'),
    ...demoLenses,
    ...microphones.map((m) => gearItem(m.label, 'Ljud', 'Studion, ljudväska', 'Tillgänglig')),
    gearItem('Zoom F6 fältinspelare', 'Ljud', 'Studion, ljudväska'),
    gearItem('Aputure 300D II', 'Ljus', 'Studion, hylla 3'),
    gearItem('Softbox 90 cm', 'Ljus', 'Studion, hylla 3'),
    gearItem('DJI RS 3 gimbal', 'Grip', 'Studion, skåp A2', 'Service', '', 'Motor drar snett, lämnad in 2/10.'),
    gearItem('Manfrotto stativ', 'Grip', 'Studion, skåp A2'),
    gearItem('Dimmaskin', 'Övrigt', 'Förrådet, hylla 1', 'Tillgänglig', '', 'Används i SC-001, boka i god tid.'),
  ];
}

function demoShootDays(): ShootDay[] {
  return [
    { id: 'DAY-DEMO-1', date: '2026-10-03', location: 'Busshållplatsen, länsväg 180', sceneIds: ['SC-001', 'SC-006', 'SC-017'], call: '05:30' },
    { id: 'DAY-DEMO-2', date: '2026-10-04', location: 'Köket, Lindgatan 12', sceneIds: ['SC-002', 'SC-007', 'SC-012', 'SC-025'], call: '08:00' },
    { id: 'DAY-DEMO-3', date: '2026-10-10', location: 'Parkeringen vid idrottshallen', sceneIds: ['SC-004', 'SC-005'], call: '18:30' },
  ];
}

export function createDemoProject(now = Date.now()): ProjectData {
  const min = 60_000;
  const edited = new Date(now);
  edited.setHours(14, 2, 0, 0);
  const updatedAt = edited.getTime() <= now ? edited.getTime() : now - 7 * min;
  return {
    id: DEMO_PROJECT_ID,
    title: 'KVAR',
    subtitle: 'Långfilmsmanus',
    format: 'Långfilm',
    studio: 'A+ Studios',
    draft: 3,
    createdAt: now - 41 * 24 * 60 * min,
    updatedAt,
    script: scriptText,
    overrides: {},
    sceneMeta: buildInitialSceneMeta(),
    characters: characters.map((c) => ({ ...c })),
    locations: locations.map((l) => ({ ...l })),
    notes: bibleNotes.map((n) => ({ ...n })),
    ghostScenes: ghostScenes.map((g) => ({ ...g, characters: [...g.characters] })),
    shots: demoShots(),
    shootDays: demoShootDays(),
    casting: demoCasting(),
    gear: demoGear(),
    recent: [
      { sceneId: 'SC-004', at: now - 3 * min },
      { sceneId: 'SC-008', at: now - 18 * min },
      { sceneId: 'SC-003', at: now - 64 * min },
      { sceneId: 'SC-007', at: now - 22 * 60 * min },
      { sceneId: 'SC-005', at: now - 26 * 60 * min },
      { sceneId: 'SC-001', at: now - 3 * 24 * 60 * min },
    ],
  };
}
