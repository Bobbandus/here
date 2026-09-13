# A+ — Write, Plan & Shoot

A+ Studios verktyg för att skriva, planera och filma. En startsida med tre verktyg som delar samma projekt:

- **A+ Write** — manus i Fountain, scenrail, story bible.
- **A+ Plan** — scenpanel (cast, rekvisita, kamera, ljud), shotlistor, inspelningsdagar, casting, gear-lista, pipeline.
- **A+ Shoot** — digital klapperbräda för inspelningsplatsen.

Scenerna som skrivs i Write är samma scener som planeras i Plan (scen-ID `SC-001` … i dokumentordning).

**Ingen AI, inget nätverk, ingen backend** — med ett enda, avsiktligt undantag. Projekt sparas lokalt i webbläsaren
(`localStorage`, nyckel `aplus.projects.v1`; personliga inställningar i `aplus.settings.v1`). AI-knappar öppnar
paneler med hårdkodad exempeldata märkt `PLATSHÅLLARE · EXEMPELDATA · INGEN AI KOPPLAD`. Referensbilder och
kandidatfoton i Casting sparas som nedskalade JPEG-dataURLer i samma projekt-JSON — helt lokalt, ingen uppladdning.
Undantaget är klapperbrädans röstuppläsning (se **Klapperbräda (A+ Shoot)** nedan), som är den enda funktionen i
hela appen som faktiskt pratar med ett moln — allt annat, i alla tre verktygen, fungerar identiskt offline.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc (strict) + vite build
npm run check    # parserns självtestfall (src/fountain/parse.test-cases.ts) via tsx
```

Stack: Vite, React 18, TypeScript (strict), Tailwind CSS v3. Inga UI-bibliotek, ingen router.
All state ligger i `AppStateProvider` (`useReducer`) i `src/state/AppState.tsx`.

## Struktur

| Yta | Komponent | Innehåll |
|---|---|---|
| Startsida | `components/home/HomeView` | Stort A+, ingångar till A+ Write och A+ Plan, projektlista, nytt projekt, återställ exempelprojekt, inställningar |
| Nytt projekt | `components/home/NewProjectDialog` | Titel, undertitel, format, start (tomt manus / mall med en scen) |
| Inställningar | `components/shell/SettingsDialog` | Tema (mörkt/ljust) och scenrubrikernas skiljetecken (bindestreck/punkt) |
| Write · Översikt | `components/dashboard/WriteOverview` | Redigerbar projektinfo, skrivstatus, stat-rutor, senast redigerat, repliker per karaktär |
| Write · Skriv | `components/editor/WriteView` | Scenrail · Fountain-editor (+ fokusläge) · story bible |
| Plan · Översikt | `components/dashboard/PlanOverview` | Pipeline-mätare, tagningar, inspelningsdagar, öppna punkter |
| Plan · Scen | `components/scene/SceneView` | Skrivskyddad manussida + metadatapaneler, AI-platshållare |
| Plan · Shotlistor | `components/plan/ShotlistView` | Tagningar per scen: nummer (4A, 4B …), klar, utsnitt, lins **+ brännvidd** med bildvinkel, rörelse, beskrivning, längd, ordning |
| Plan · Inspelningsdagar | `components/plan/ShootDaysView` | Skapa/redigera/ta bort dagar, koppla scener, sidor/tagningar/längd per dag |
| Plan · Casting | `components/plan/CastingView` | Per roll: referensbilder + kandidater med foto/anteckningar/"vald"; valda dyker upp i scenens cast-dropdown |
| Plan · Utrustning | `components/plan/GearView` | Gear-lista: namn, kategori, förvaringsplats, status (tillgänglig/utlånad/service), tilldelad, filter/sök |
| Plan · Pipeline | `components/pipeline/PipelineBoard` | Alla scener × fyra stadier, klickbara statuschips, filter, totaler |
| Shoot · Klapperbräda | `components/shoot/ClapperboardView` | Immersiv, helskärm som standard. Brädan är knappen: pip → "quiet, slating" → scen/tagning/tid på engelska → klapp, tidskod som fryser vid klappet |

Växla verktyg med `WRITE | PLAN | SHOOT` i toppbaren; A+-märket leder tillbaka till startsidan.

### Data

- `src/types.ts` — `ProjectData` (manus, tvingade radtyper, scenmetadata, story bible, tagningar, inspelningsdagar,
  casting, gear, historik) samt `Settings` (tema, rubrikstil).
- `src/state/projects.ts` — `createProject`, projektlagring (`loadStored`/`saveStored`), inställningslagring
  (`loadSettings`/`saveSettings`), tidsformat.
- `src/data/project.ts` — exempelprojektet KVAR (8 scener med Fountain-text + 34 metadatascener, casting, gear).
- `src/data/production.ts` — delad inventarie: linser, mikrofoner, rekvisita, cast.
- `src/data/mockAiOutput.ts` — platshållarens exempeldata.

Scen-ID är ordningsbaserade. Läggs en scen till tidigt i manuset flyttas senare scen-ID ett steg, och metadata och
tagningar som är kopplade till ID:t följer positionen, inte scenen. Stabila scen-UUID:n är nästa steg om det blir ett problem.

## Inställningar

Gearikonen i toppbaren (eller `Ctrl/Cmd+K → Inställningar…`) öppnar:

- **Tema** — *Mörkt* (studioläget, som tidigare) eller *Ljust*, inspirerat av macOS runt 2018–2022: ljusgrå fönsterbotten,
  vita kort med mjuk skugga, mer rundade hörn. Ingen Apple-grafik återanvänd, bara samma luftiga känsla. Genomförd som
  CSS-variabler (`--c-ink`, `--c-surface`, … i `src/index.css`, kopplade via `rgb(var(--x) / <alpha-value>)` i
  `tailwind.config.js`) växlade via `[data-theme]` på `<html>` — alla befintliga `bg-ink`/`text-muted`/… klasser
  följer med automatiskt, ingen komponent behövde färgas om separat. Manussidan (`paper`) är alltid samma varma
  off-white oavsett tema.
- **Scenrubriker** — *Bindestreck* (`EXT. PLATS – DAG`, standard) eller *Punkt* (`EXT. PLATS. DAG.`), efter att flera
  manusförfattare använder punktstilen. Styr bara vad autocomplete skriver in; befintliga rubriker i manuset — oavsett
  stil — tolkas alltid korrekt (se nästa avsnitt).

Båda sparas personligt (`aplus.settings.v1`), inte per projekt.

## Tangentbordsgenvägar

**Globalt**

| Genväg | Effekt |
|---|---|
| `Ctrl/Cmd+K` | Kommandopalett: gå till scen, byt vy, byt projekt, nytt projekt, startsida, inställningar |
| `Ctrl/Cmd+S` | Toast — sparning sker ändå automatiskt lokalt |
| `Esc` | Stänger palett, dialog, AI-panel eller fokusläge |

**Editorn (A+ Write)**

| Genväg | Effekt |
|---|---|
| `Tab` / `Shift+Tab` på tom rad | Cyklar radtyp: action → character → parenthetical → dialogue → transition |
| `Tab` / `Enter` med förslagslista | Accepterar förslag. `↑` `↓` navigerar, `Esc` stänger |
| `Enter` på character | Ny rad startar som dialogue |
| `Enter` på tom dialogue | Tillbaka till action |
| `Enter` på scenrubrik | Tom rad + action |
| `(` på tom rad direkt efter character | Infogar `()` med markören mellan |
| `Ctrl/Cmd+Enter` | Ny scenrubrik `INT. ` med öppen platsautocomplete |
| `Ctrl/Cmd+1..5` (reserv: `Alt+1..5`) | Tvinga rad: scene heading / action / character / dialogue / transition |
| `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y` | Ångra / gör om |
| `Ctrl/Cmd+.` | Fokusläge på/av (döljer sidorail, story bible och verktygsrad) |
| `Esc` utan förslagslista | Lämnar editorn |

Chrome och Edge reserverar `Ctrl+1..8` för flikbyte — använd `Alt+1..5` där.

**Shotlistor (A+ Plan)**: `Enter` i sista tagningens beskrivning lägger till nästa tagning.

## Autocomplete och "allt är convertable"

- **Scenrubrik**: `E`/`I`/`Ö` efter tom rad → `EXT.`, `INT.`, `INT./EXT.`, `EST.`, `ÖVERGÅNG`; efter prefix → platser
  (från story bible **och** platser som redan skrivits ut i manuset — inget behöver läggas till manuellt i förväg);
  efter skiljetecknet (` – ` eller `. `, efter inställning) → tid på dygnet.
- **Karaktär**: i karaktärsposition föreslås namn sorterade efter antal repliker — från story bible **och** namn som
  redan förekommer i manuset men aldrig lagts till där. Skriver du `emma` och det redan finns en `EMMA` i manuset,
  ger `Tab` samma sak som på en scenrubrik: fullständigt namn. Efter `(` → `(FORTS.)`, `(V.O.)`, `(O.S.)`.
- **Karaktärsnamn med kolon** (`Kim:` istället för `KIM`) känns igen som en manusdialekt och blir en giltig
  character-rad.
- **Manuella scennummer** — vissa manusförfattare skriver egna nummer framför rubriken (`2. EXT. KIOSK. DAG.`,
  `7A. INT. …`). De känns igen som scenrubrik och står kvar oförändrade i texten; appens egen `SC-00N`-numrering
  (använd för Plan/Pipeline/Shotlistor) är separat och baseras på ordning, inte på det inskrivna numret.
- **Skriver du `INT.`/`EXT.` på en rad som inte redan är en scenrubrik** — mitt i ett stycke, eller på en rad som
  editorn nyss tvingat till `action` (t.ex. raden efter en scenrubriks `Enter`) — konverteras raden automatiskt: en
  tom rad bryts in vid behov och en eventuell motstridig tvingning tas bort. Det är alltså "convertible" även utan
  tom rad före, precis som efterfrågat. Motsvarande auto-konvertering finns *inte* för karaktärsrader (för hög risk
  för falska positiver i vanlig prosa) — där fungerar `Tab`-cykling som vanligt.
- Scenrubriker, karaktärer och övergångar versaliseras live på aktuell rad.

Implementerat i `fountain/parse.ts` (`parseHeading` stödjer båda skiljetecken-stilarna och manuella scennummer,
`isCharacterCandidate` tolererar avslutande kolon, `looksLikeSceneHeading`) och i
`components/editor/ScriptEditor.tsx` (konverteringseffekten, se kommentaren "Allt ska vara convertable" i koden).

**Känd begränsning**: en del manusförfattare skriver karaktärsnamn med kolon följt av en *tom rad* och sedan
repliken med ett ledande bindestreck (`Måns:` \n\n `- Jamen aj som fan…`). Det mönstret normaliseras inte
automatiskt — dialogen hamnar som en egen `action`-rad. Kolon-namn direkt följt av repliken (utan tom rad emellan)
fungerar som tänkt.

## Casting

Varje roll i story bible får en egen sida under **Plan → Casting**: referensbilder för hur rollen ska se ut, och en
lista kandidater med foto (laddas upp, skalas ner till max 480 px JPEG lokalt i webbläsaren via
`components/plan/imageUtils.ts`, sparas som data-URL i projektet), anteckningar och en "vald"-markering. En vald
kandidat dyker automatiskt upp som ett extra alternativ (märkt "Vald i casting") i scenens cast-dropdown under
**Plan → Scen**, utöver den delade skådespelarlistan i `data/production.ts`.

**Autogenererad castingpost**: så fort en ny roll skapas i story bible (`ADD_CHARACTER`) får den direkt en tom
castingpost (redo för referensbilder/kandidater) utan extra steg. Byts rollens namn flyttas posten med till det nya
namnet (castingdata är nyckel-lagrad på rollnamn); tas rollen bort städas posten bort. Se `case 'ADD_CHARACTER'` /
`'UPDATE_CHARACTER'` / `'DELETE_CHARACTER'` i `src/state/AppState.tsx`.

## Objektiv: gear-listan är källan, inte en separat linsinventarie

Det finns **ingen egen delad linslista** — objektiv är gear-objekt i projektets egen **Plan → Utrustning**-lista
(kategori `"Objektiv"`), precis som kameror och ljus. Lägger, redigerar eller tar du bort ett objektiv i Utrustning
uppdateras shotlistans och Scen-panelens kameraval direkt, i samma render — inga separata listor som kan råka ur
synk. Det gör att t.ex. bildvinkeln alltid stämmer mot vad du faktiskt äger, inte mot en påhittad standardlista.

Ett `GearItem` (`src/types.ts`) har för kategori "Objektiv" tre extra fält: `focalMin`, `focalMax` (mm) och
`aperture`. `focalMin === focalMax` betyder ett **fast objektiv (prime)**; olika värden betyder **zoom**.
`lensGear()` (`components/plan/shots.ts`) filtrerar fram gear-objekt som faktiskt har brännvidd ifylld, så
ofullständiga rader inte dyker upp som valbara objektiv förrän de är kompletta.

I Utrustning visas objektivets brännvidd som en enda läsbar kolumn (t.ex. `12–42 mm · f/2.8`). Man redigerar den
inte direkt i tabellen — en pennikon bredvid papperskorgen (bara på objektiv-rader) öppnar en liten förankrad meny
(`components/ui/Popover.tsx`, återanvänd av bildutsnittsväljaren nedan) med ett fritextfält för brännvidd och ett
för bländare. Fältet tolkas löpande av `parseFocalRange` (`data/production.ts`): ett ensamt tal ("50") blir ett
fast objektiv, två tal med bindestreck ("12-42", även tankstreck) blir ett zoomintervall — menyn visar direkt om
det tolkades som fast/zoom eller inte gick att tolka, och skriver till gear-listan så fort texten är giltig.

Varje tagning i shotlistan har, utöver vilket objektiv som valts, en egen brännvidd (`Shot.focalMm`):

- **Fast objektiv** — visas som fast, ej redigerbar text (t.ex. `85`).
- **Zoomobjektiv** — t.ex. `12–42 mm f/3.5–5.6` (ett typiskt kit-zoom-exempel, seedat i exempelprojektet) — får ett
  eget redigerbart mm-fält, begränsat till objektivets intervall (`clampFocal`). Bildvinkeln i "Vinkel"-kolumnen
  räknas alltid ut från den faktiskt valda brännvidden (`horizontalAngle(shot.focalMm ?? lens.focalMin)`) — inte
  objektivets vidaste läge, vilket var en bugg i den första versionen. Byter man objektiv på en tagning återställs
  brännvidden till det nya objektivets minimum (eller fasta värde för en prime).

`isZoomLens`/`clampFocal` (rena, generiska — tar bara emot `{ focalMin, focalMax }`) finns i `data/production.ts`.
Har projektet inga objektiv i Utrustning ännu visar shotlistan en gul hänvisning dit istället för en tom
lins-dropdown.

**Bildutsnitt som ramskisser**: shotlistans utsnittskolumn (`ShotType`) är en knapp — `ShotTypePicker`
(`components/plan/ShotTypePicker.tsx`) — som visar en liten SVG-skiss av framingen (`ShotFrameIcon.tsx`) och öppnar
samma sortens förankrade meny som objektivredigeraren, med alla 13 typer i ett rutnät (ikon + kod + svensk
etikett, nuvarande vald typ markerad). Utöver de ursprungliga nio (`WS`, `MS`, `MCU`, `CU`, `ECU`, `OTS`,
`2-SHOT`, `INSERT`, `POV`) finns nu `EST` (etablering), `MASTER` (totalbild), `GROUP` (gruppbild) och `CUTAWAY`.
Ikonerna är rena geometriska skisser (huvud + axlar, skalat och klippt mot bildrutan) — inga bilder, ingen AI.

## Utrustning (gear)

**Plan → Utrustning** listar all gear per projekt: namn, kategori, förvaringsplats, status
(tillgänglig/utlånad/service), vem den är tilldelad och anteckningar. Filtrera på status eller sök fritt. Nya
projekt börjar med en tom lista; exempelprojektet är förifyllt utifrån linsinventarien i `data/production.ts` plus
kamera, ljus och grip.

## Klapperbräda (A+ Shoot)

**A+ Shoot** är ett tredje verktyg (eget hemskärmskort, egen `SET_APP`-lägen `'shoot'`) med en enda vy: en digital
klapperbräda för inspelningsplatsen. Den öppnas **immersivt** — `App.tsx` renderar `ClapperboardView` helt utan den
vanliga sidebaren/toppbaren (samma gren som fokusläget använder för `ScriptEditor`), så hela fönstret blir brädan.
En liten knapp i eget hörn anropar dessutom webbläsarens riktiga `requestFullscreen()`/`exitFullscreen()` för
äkta helskärm (t.ex. en iPad tillagd på hemskärmen). Layouten är landskapsorienterad — bräda till vänster, en smal
kolumn med siffror till höger — för att passa en 16:9-skärm eller en iPad i liggande läge utan att behöva scrolla.
Källan är `components/shoot/ClapperboardView.tsx` plus tre små hjälpmoduler under `src/shoot/`.

**Brädan är knappen, och allt som behövs när man filmar står på brädan — inte i panelen.** Det finns ingen separat
"klappa"-knapp eller "tap to slate"-text (självförklarande) — hela klapperbrädans grafik (randig arm + en ljus
"papper"-kropp, `bg-paper`/fast svart text oavsett appens ljusa/mörka tema) är själva tryckytan. Kroppen visar
samma fält som en riktig fysisk slate, alla icke-redigerbara (bara en spegling av sidopanelens värden):

- **Datum + tid** (`boardDate`/`boardTime`) överst, alltid läsbara — se varför nedan.
- **SCENE / SETUP / TAKE** som tre tryckta rutor med tunna avdelare.
- **Tidskoden** (`HH:MM:SS:FF`, 25 fps) i ett eget svart LED-fält mitt på brädan — inte i sidopanelen, just för att
  den ska synas även när panelen är dold (se nedan).
- Sekvensens status (`QUIET ON SET`, `SLATING…`, `CLAP!`) i rött längst ner — tomt i vila.

Mellanslag klappar också (utom när fokus ligger i ett textfält eller en meny), och `Escape` går tillbaka till
startsidan när ingen sekvens pågår.

**Dölj panelen när kameran rullar.** Panel-knappen i topplisten (bredvid helskärmsknappen) fäller ihop hela
sidopanelen — inget av det som bara är till för att ställa in nästa tagning ska synas när man faktiskt filmar.
Brädan breddas för att fylla utrymmet och visar fortfarande allt som behövs (datum, tid, scen/setup/tagning,
tidskod). Klicka igen för att ta fram panelen och justera för nästa tagning.

**Scen / vinkel / tagning ställs in i sidopanelen**, inte på själva brädan — så att man kan justera dem utan att
råka trycka igång en klappning:

- **Scen** — fritt tal, hämtas som förval från projektets manus via en liten meny i topplisten (som även fyller i
  INT/EXT från den scenens `int_ext` om den är känd), men kan också klivas/skrivas fritt för uppsamlingstagningar
  som inte finns i manuset ännu.
- **Setup** — en bokstavskod (A, B, C … samma `shotLetter()`-hjälpare som Shotlistans tagningsbokstäver,
  `components/plan/shots.ts`), visad tillsammans med sin NATO-bokstavering (`shoot/nato.ts → natoSpell`, t.ex.
  "B" → "Bravo"). Pilen uppåt ökar bokstaven **och nollställer tagningen till 1** i samma klick — precis den
  regeln riktiga set använder.
- **Take** — heltal, ökas manuellt per ny tagning av samma setup.

Sidopanelen har också DAY/NIGHT, INT/EXT och SYNC/MOS som genomstrukna växlingsknappar (den icke-valda texten får
`line-through`, som på en pappersslate) — inga fält som inte används av något (som regi/foto-rutor utan koppling
till projektdata) tar plats här.

**Datum + tid är alltid synliga på brädan, inte bara uppläst.** Rösten säger klockslaget (se nedan), men röst kräver
internet och kan misslyckas — så `boardDate`/`boardTime` skriver samma information direkt på den tryckta
"pappers"-ytan, uppdaterat live, oavsett om rösten fungerar. Det är samma idé som en riktig klapperbrädas datumfält:
informationen ska gå att läsa av i bild, inte bara höras.

**Klappsekvensen**, på engelska (ljud/röst + text), körs i tur och ordning när brädan trycks eller mellanslag
trycks:

1. **Pip** — riktig ljudfil (`public/sfx/beep.mp3`, spelas via `shoot/audio.ts → playBeep`).
2. **Tyst-ansägning** — en riktig, förinspelad ljudfil (`public/sfx/voiceoverQuietSlating.mp3` → `playQuietSlating`)
   säger "Quiet on set. Slating." — **ingen TTS för den raden**, den är alltid samma och kräver därför inget
   nätverk.
3. **Datum/tid/scen/tagning-uppläsning** — klapparmen tiltar upp samtidigt som en röst läser upp t.ex. "Date,
   September 13, 2026. Time, 12:36:47 PM. Scene 1 Bravo. Take 2." Datum och tid sägs *först*, precis efter att
   klockslaget hämtas — det håller gapet mellan "det klockslag som sägs" och "det klockslag det faktiskt var" så
   kort som möjligt, istället för att tiden riskerar bli inaktuell efter att en lång mening redan hunnit läsas
   upp. Det här steget *måste* vara talsyntes (Puter, se nedan) eftersom innehållet är dynamiskt och inte kan
   spelas in i förväg. Bokstaven stavas alltid ut enligt NATO-alfabetet (aldrig som en rå bokstav, så den aldrig
   kan misshöras).
4. **Klapp** — i exakt samma ögonblick slår armen igen (CSS-transition, snabb `cubic-bezier` nedåt mot en långsam
   uppåt), tidskoden på brädan fryser på sitt då aktuella värde, och klappljudet spelas (`public/sfx/clap.mp3` →
   `playClap`).

Tidskoden räknas från systemklockan och fryser bara visuellt vid klappet — den fortsätter räkna i bakgrunden och
återupptar visningen efter en kort hållpaus. Det ger samma "frys vid klapp"-referens som en fysisk time-code-slate,
utan att behöva en riktig inspelningsklocka.

**Röstuppläsningen av scen/tagning/tid — appens enda nätverksanrop.** Den körs via [Puter.js](https://developer.puter.com/)
— `puter.ai.txt2speech(text, 'en-US')`, en engelsk röst — som laddas in (ett `<script>`-tag som injiceras i
`<head>`) först när någon faktiskt trycker på brädan första gången, inte vid appstart. Ingen API-nyckel, ingen
backend i det här projektet; Puter sköter själva talsyntesen i molnet. Både den och de tre ljudfilerna har en
tidsgräns (`shoot/audio.ts → withTimeout`, `shoot/tts.ts → withTimeout`, 4–5 sekunder) — misslyckas något (offline,
blockerat skript/ljud, eller att Puter första gången visar sin egen engångsruta för samtycke till molntjänsten och
ingen hinner klicka) fortsätter sekvensen ändå till klappet med tiltande arm och fryst tidskod, bara utan just det
ljudet, och en gul rad förklarar varför. Praktiskt: brädan går aldrig att fastna på, och pip/tyst-ansägning/klapp
fungerar alltid även helt utan internet — det är bara den dynamiska scen/tagning/tid-uppläsningen som kan utebli.

## Editorns konstruktion

`ScriptEditor` bygger på overlay-principen: en `<textarea>` är sanningskällan för inmatning (tangentbord, IME, klistra in,
radering) och ett `aria-hidden`-lager (`HighlightLayer`) renderar texten radvis i Courier Prime 15/24 px.

Per-rad-indragen (character 220 px, dialogue 130 px med maxbredd osv.) går inte att uttrycka i en textarea, så en genomskinlig
textarea direkt ovanpå skulle få en markör som glider isär från texten. Därför ritas markör och markering i lagret, klick/drag
mappas till dokumentposition med `caretPositionFromPoint`, `↑`/`↓`/`Home`/`End` hanteras i editorn och den osynliga textarean
följer markören (för autoscroll och IME).

Tvingade radtyper från editorn lagras som `overrides` per radindex och flyttas med vid radändringar
(`components/editor/editing.ts → shiftOverrides`). Explicita Fountain-markörer (`.`, `@`, `>`, `!`, `=`, `#`, `[[ ]]`)
har normalt företräde framför `overrides` — utom i konverteringsfallet ovan, där en upptäckt `INT./EXT.`-prefix
medvetet rensar en motstridig tvingning.

## Fokusläge

`Ctrl/Cmd+.` (eller knappen "Fokusläge" i editorns verktygsrad) döljer sidorail, sidebar, toppbar, statusrad och
story bible — kvar blir bara manussidan och en liten flytande "Avsluta fokusläge"-pil. `Esc` eller samma
tangentbordsgenväg avslutar. Tänkt för när man bara vill skriva, utan resten av verktyget i vägen.

## Var AI-integrationen ska kopplas in senare

All AI-yta är i dag presentationslager. `INFOGA` fungerar redan lokalt: shotlist-förslag blir tagningar
(`components/plan/shots.ts → shotFromMockItem`), blockning och synopsis läggs i scenens regianteckningar
(`components/scene/useAiInsert.ts`). Det som skickas in är fortfarande exempeldata.

1. **`src/data/mockAiOutput.ts`** — ersätt konstanterna med ett serviceanrop. `AiOutput` i `src/types.ts` är tänkt som svarskontrakt.
2. **`components/scene/AiPlaceholderPanel.tsx`** — läser `mockAiOutput[kind]` direkt. Saknade props:
   `output: AiOutput | null`, `status: 'idle' | 'loading' | 'error' | 'ready'`, `onRegenerate()` och `basis`
   (vilket underlag som skickats; fotnoten är statisk text). `onInsert` finns redan.
3. **`components/scene/AiActionButton.tsx`** — dispatchar `OPEN_AI`. Behöver `onRequest(kind, sceneId)` samt laddningstillstånd.
4. **`state/AppState.tsx`** — `ai: AiKind | null` behöver bli `{ kind, sceneId, status, output, error }` med
   `AI_REQUEST` / `AI_SUCCESS` / `AI_FAILURE`.
5. **Underlag** — `derive(project).sceneById[id]`, `project.characters`, `project.locations`,
   `project.sceneMeta[id].production` och `project.shots[id]`.
6. **Synopsis i manus** — i dag hamnar den i regianteckningar; att skriva in den som `= `-rad under scenrubriken kräver en
   `INSERT_TEXT`-action som även flyttar `overrides` via `shiftOverrides`.

Kommandopaletten ska medvetet inte ha AI-kommandon. Mätvärdespanelerna (lins, ljud, granskning) visar parameter / uppmätt /
tröskel / avvikelse — inga betyg, ingen sammanfattning, inget godkännande. Bildvinkeln räknas lokalt
(`2 · atan(sensorbredd / (2 · f))`, `data/production.ts → horizontalAngle`).

## Nästa steg mot en riktig produkt

- Synk/backend (i dag bara localStorage per webbläsare) och export/import av projekt (`.fountain` + JSON).
- Stabila scen-ID:n oberoende av ordning.
- Egen cast- och rekvisitainventarie per projekt (i dag delad mockinventarie för skådespelare/rekvisita — objektiv
  är redan projektspecifikt via gear-listan, se ovan).
- Utskrift/PDF av manus, shotlista, dagsschema (call sheet) och castingöversikt.
- Sök & ersätt i manuset.
- Normalisering av fler alternativa manuskonventioner (se "Känd begränsning" ovan).
