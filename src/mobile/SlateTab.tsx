import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useApp } from '../state/AppState';
import { natoSpell } from '../shoot/nato';
import { shotLetter } from '../components/plan/shots';
import { Icon } from '../components/ui/Icon';
import { FieldLabel, IconButton, MHeader, Segmented, Sheet } from './ui';
import {
  clipDurationMs,
  playClip,
  playOnlineVoice,
  prepareOnlineVoice,
  preloadSlateAudio,
  speakWithDevice,
  unlockSlateAudio,
} from './slateAudio';

export interface SlatePreset {
  scene: string;
  intExt: 'INT' | 'EXT' | null;
  dayNight: 'DAY' | 'NIGHT' | null;
  nonce: number;
}

type Phase = 'idle' | 'beep' | 'quiet' | 'announce' | 'clap' | 'hold';
type VoiceMode = 'online' | 'device' | 'off';

interface SlateSettings {
  scene: string;
  setupIndex: number;
  take: number;
  intExt: 'INT' | 'EXT';
  dayNight: 'DAY' | 'NIGHT';
  sync: 'SYNC' | 'MOS';
  voice: VoiceMode;
}

const DEFAULTS: SlateSettings = { scene: '1', setupIndex: 0, take: 1, intExt: 'INT', dayNight: 'DAY', sync: 'SYNC', voice: 'online' };
const FPS = 25;
const STRIPES = ['#1a8f52', '#f4c548', '#2f8fd6', '#c62b3a', '#e9e4e0', '#8f8b86', '#2a2a2a'];
const stripeStyle: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(115deg, ${STRIPES.map((c, i) => `${c} ${(i * 100) / STRIPES.length}%, ${c} ${((i + 1) * 100) / STRIPES.length}%`).join(', ')})`,
};

const pad = (n: number) => String(n).padStart(2, '0');
const timecode = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(Math.floor((d.getMilliseconds() / 1000) * FPS))}`;
const spokenDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const spokenTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const boardDate = (d: Date) => d.toLocaleDateString('sv-SE');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STATUS: Record<Phase, string> = { idle: '', beep: '●', quiet: 'QUIET ON SET', announce: 'SLATING', clap: 'CLAP', hold: 'CLAP' };

function loadSettings(projectId: string): SlateSettings {
  try {
    const raw = localStorage.getItem(`aplus.mobile.slate.${projectId}`);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SlateSettings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function SlateTab({ preset, filming, setFilming }: { preset: SlatePreset | null; filming: boolean; setFilming: (on: boolean) => void }) {
  const { state, derived } = useApp();
  const projectId = state.project.id;
  const [s, setS] = useState<SlateSettings>(() => loadSettings(projectId));
  const [phase, setPhase] = useState<Phase>('idle');
  const [armUp, setArmUp] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [frozen, setFrozen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const alive = useRef(true);
  const busy = phase !== 'idle';

  const patch = (p: Partial<SlateSettings>) => setS((prev) => ({ ...prev, ...p }));

  useEffect(() => {
    alive.current = true;
    preloadSlateAudio();
    const id = window.setInterval(() => setNow(new Date()), 1000 / FPS);
    return () => {
      alive.current = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => setS(loadSettings(projectId)), [projectId]);

  useEffect(() => {
    try {
      localStorage.setItem(`aplus.mobile.slate.${projectId}`, JSON.stringify(s));
    } catch {
      /* privat läge */
    }
  }, [s, projectId]);

  useEffect(() => {
    if (!preset) return;
    setS((prev) => ({
      ...prev,
      scene: preset.scene,
      setupIndex: 0,
      take: 1,
      intExt: preset.intExt ?? prev.intExt,
      dayNight: preset.dayNight ?? prev.dayNight,
    }));
  }, [preset]);

  // Skärmen får inte slockna mitt i en tagning.
  useEffect(() => {
    type Lock = { release: () => Promise<void> };
    let lock: Lock | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Lock> } };
    const request = () => {
      nav.wakeLock
        ?.request('screen')
        .then((l) => {
          lock = l;
        })
        .catch(() => undefined);
    };
    request();
    const onVisible = () => document.visibilityState === 'visible' && request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, []);

  const setup = shotLetter(s.setupIndex);

  async function slate() {
    if (busy) return;
    unlockSlateAudio(); // måste ske synkront i trycket — annars blockerar iOS allt ljud efter första await
    setNotice(null);
    setFrozen(null);

    // Klockslaget som sägs avser klappögonblicket, avrundat till minut — så det
    // aldrig hinner bli "fel" medan meningen läses upp. Exakt bildruta fryses på brädan.
    const predictedClap = new Date(Date.now() + clipDurationMs('beep') + clipDurationMs('quiet') + 4500);
    const text = `Date, ${spokenDate(predictedClap)}. Time, ${spokenTime(predictedClap)}. Scene ${s.scene} ${natoSpell(setup)}. Take ${s.take}.`;
    const onlineSrc = s.voice === 'online' ? prepareOnlineVoice(text) : Promise.resolve(null);

    setPhase('beep');
    await playClip('beep');
    if (!alive.current) return;

    setPhase('quiet');
    await playClip('quiet');
    if (!alive.current) return;

    setPhase('announce');
    setArmUp(true);
    if (s.voice === 'off') {
      await sleep(1500);
    } else {
      let spoke = false;
      if (s.voice === 'online') {
        const src = await Promise.race([onlineSrc, sleep(2500).then(() => null)]);
        if (src) spoke = await playOnlineVoice(src);
      }
      if (!spoke) {
        spoke = await speakWithDevice(text);
        if (s.voice === 'online') setNotice('Online-rösten svarade inte — enhetens röst användes.');
      }
      if (!spoke) {
        setNotice('Ingen röst tillgänglig — pip, klapp och tidskod körs ändå.');
        await sleep(1500);
      }
    }
    if (!alive.current) return;

    setFrozen(timecode(new Date()));
    setArmUp(false);
    setPhase('clap');
    await playClip('clap');
    if (!alive.current) return;
    setPhase('hold');
    await sleep(1600);
    if (!alive.current) return;
    setPhase('idle');
    setFrozen(null);
  }

  const pickScene = (i: number) => {
    const sc = derived.scenes[i];
    const ie = sc.int_ext === 'INT' || sc.int_ext === 'EXT' ? sc.int_ext : s.intExt;
    const night = /NATT|KVÄLL|NIGHT|EVENING/u.test((sc.time_of_day ?? '').toUpperCase());
    patch({ scene: String(i + 1), setupIndex: 0, take: 1, intExt: ie, dayNight: night ? 'NIGHT' : 'DAY' });
  };

  const bigBtn = 'flex h-14 flex-1 items-center justify-center gap-2 rounded-[16px] border border-line bg-surface text-[16px] font-bold text-text active:bg-raised disabled:opacity-40';

  return (
    <div className="relative flex h-full flex-col bg-ink">
      {!filming && (
        <div className="landscape:hidden">
          <MHeader
            title="Klapperbräda"
            sub={state.project.title}
            right={
              <>
                <IconButton icon="focus" label="Filmläge (dölj kontroller)" onClick={() => setFilming(true)} />
                <IconButton icon="cog" label="Inställningar" onClick={() => setSheet(true)} />
              </>
            }
          />
        </div>
      )}

      <div className={`flex min-h-0 flex-1 flex-col gap-3 landscape:flex-row ${filming ? 'p-2' : 'p-3'}`}>
        <button
          type="button"
          onClick={() => void slate()}
          aria-label={busy ? 'Slatear' : 'Tryck för att slatea'}
          className="flex min-h-0 flex-1 flex-col text-left"
        >
          <div className="relative h-[9%] min-h-9 w-full landscape:h-[11%] landscape:min-h-6">
            <div
              aria-hidden="true"
              className="absolute inset-0 origin-bottom-left rounded-t-[8px] border border-b-0 border-black/50"
              style={{
                ...stripeStyle,
                transform: `rotate(${armUp ? -16 : 0}deg)`,
                transition: armUp ? 'transform 380ms cubic-bezier(.2,.7,.3,1)' : 'transform 80ms cubic-bezier(.5,0,1,1)',
              }}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[14px] border border-t-0 border-black/50 bg-paper text-black">
            <div className="h-5 shrink-0 border-b border-black/40 landscape:h-3" style={stripeStyle} aria-hidden="true" />
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/15 px-4 py-2 font-mono text-[clamp(11px,3.2vmin,15px)] font-bold uppercase landscape:py-1">
              <span className="min-w-0 truncate">{state.project.title}</span>
              <span className="hidden shrink-0 gap-3 landscape:flex">
                <span>{s.intExt}</span>
                <span>{s.dayNight}</span>
                <span>{s.sync}</span>
              </span>
              <span className="shrink-0">{boardDate(now)}</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-3 divide-x divide-black/15">
              {[
                { k: 'SCENE', v: s.scene, sub: '' },
                { k: 'SETUP', v: setup, sub: natoSpell(setup) },
                { k: 'TAKE', v: String(s.take), sub: '' },
              ].map((c) => (
                <div key={c.k} className="flex min-w-0 flex-col items-center justify-center px-1">
                  <span className="font-mono text-[clamp(10px,2.8vmin,13px)] font-bold tracking-[0.12em] text-black/50">{c.k}</span>
                  <span className="max-w-full truncate font-black text-[clamp(2.6rem,15vmin,7rem)] leading-none">{c.v}</span>
                  <span className="h-4 font-mono text-[clamp(9px,2.6vmin,12px)] font-bold uppercase text-black/55">{c.sub}</span>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 justify-center gap-4 border-t border-black/15 py-1.5 font-mono text-[clamp(11px,3vmin,14px)] font-bold landscape:hidden">
              <span>{s.intExt}</span>
              <span>{s.dayNight}</span>
              <span>{s.sync}</span>
              <span className="text-black/50">{new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex shrink-0 items-center justify-center bg-black py-[1.5vmin]">
              <span className="font-mono text-[clamp(1.6rem,10vmin,4.2rem)] font-bold tabular-nums tracking-[0.02em] text-[#ff4b3e] [text-shadow:0_0_14px_rgba(255,75,62,.55)]">
                {frozen ?? timecode(now)}
              </span>
            </div>
            <div className="flex h-[clamp(28px,7vmin,44px)] shrink-0 items-center justify-center font-mono text-[clamp(13px,4vmin,20px)] font-bold tracking-[0.1em] text-[#d81f10]">
              {STATUS[phase]}
            </div>
          </div>
        </button>

        {!filming && (
          <div className="flex shrink-0 flex-col gap-2 landscape:w-60 landscape:justify-center">
            <div className="hidden gap-2 landscape:flex">
              <button type="button" onClick={() => setFilming(true)} className={bigBtn}>
                <Icon name="focus" size={16} />
                Filmläge
              </button>
              <button type="button" onClick={() => setSheet(true)} aria-label="Inställningar" className={`${bigBtn} max-w-14`}>
                <Icon name="cog" size={18} />
              </button>
            </div>
            {notice && <p className="px-1 text-center text-[13px] text-gold">{notice}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={busy || s.take <= 1} onClick={() => patch({ take: s.take - 1 })} className={bigBtn} aria-label="Föregående tagning">
                − Take
              </button>
              <button type="button" disabled={busy} onClick={() => patch({ take: s.take + 1 })} className={bigBtn}>
                + Take
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => patch({ setupIndex: s.setupIndex + 1, take: 1 })} className={bigBtn}>
                Ny vinkel → {shotLetter(s.setupIndex + 1)}
              </button>
              <button type="button" disabled={busy} onClick={() => setSheet(true)} className={bigBtn}>
                Scen {s.scene}
                <Icon name="chevronRight" size={14} className="rotate-90 text-muted" />
              </button>
            </div>
          </div>
        )}
      </div>

      {filming && (
        <button
          type="button"
          onClick={() => setFilming(false)}
          className="absolute right-3 top-3 z-10 h-10 rounded-full bg-black/55 px-4 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white/80 backdrop-blur"
        >
          Visa kontroller
        </button>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Klapperbräda">
        <FieldLabel>Scen, vinkel, tagning</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Scen', value: s.scene, dec: () => patch({ scene: String(Math.max(1, (Number(s.scene) || 1) - 1)) }), inc: () => patch({ scene: String((Number(s.scene) || 0) + 1) }) },
            { label: 'Vinkel', value: setup, dec: () => patch({ setupIndex: Math.max(0, s.setupIndex - 1) }), inc: () => patch({ setupIndex: s.setupIndex + 1, take: 1 }) },
            { label: 'Take', value: String(s.take), dec: () => patch({ take: Math.max(1, s.take - 1) }), inc: () => patch({ take: s.take + 1 }) },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center rounded-[14px] bg-ink py-2">
              <span className="text-[12px] text-muted">{f.label}</span>
              <span className="font-black text-[28px] leading-tight">{f.value}</span>
              <div className="flex gap-1">
                <button type="button" onClick={f.dec} aria-label={`Minska ${f.label}`} className="h-11 w-11 rounded-full text-[22px] text-text active:bg-raised">
                  −
                </button>
                <button type="button" onClick={f.inc} aria-label={`Öka ${f.label}`} className="h-11 w-11 rounded-full text-[22px] text-text active:bg-raised">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <FieldLabel>Interiör / exteriör</FieldLabel>
        <Segmented label="Int eller ext" value={s.intExt} onChange={(v) => patch({ intExt: v })} options={[{ value: 'INT', label: 'Int' }, { value: 'EXT', label: 'Ext' }]} />
        <FieldLabel>Dag / natt</FieldLabel>
        <Segmented label="Dag eller natt" value={s.dayNight} onChange={(v) => patch({ dayNight: v })} options={[{ value: 'DAY', label: 'Dag' }, { value: 'NIGHT', label: 'Natt' }]} />
        <FieldLabel>Ljud</FieldLabel>
        <Segmented label="Synk eller MOS" value={s.sync} onChange={(v) => patch({ sync: v })} options={[{ value: 'SYNC', label: 'Synk' }, { value: 'MOS', label: 'MOS' }]} />
        <FieldLabel>Röst</FieldLabel>
        <Segmented
          label="Röst"
          value={s.voice}
          onChange={(v) => patch({ voice: v })}
          options={[
            { value: 'online', label: 'Online' },
            { value: 'device', label: 'Offline' },
            { value: 'off', label: 'Av' },
          ]}
        />
        <p className="mt-2 text-[13px] leading-snug text-muted">Online = Puter (bättre röst, kräver nät). Offline = telefonens egen röst, fungerar utan nät. Online faller automatiskt tillbaka på offline.</p>

        <FieldLabel>Hämta scen från manus</FieldLabel>
        <div className="flex flex-col">
          {derived.scenes.map((sc, i) => (
            <button
              key={sc.scene_id}
              type="button"
              onClick={() => {
                pickScene(i);
                setSheet(false);
              }}
              className={`flex min-h-12 items-center gap-3 border-b border-line py-3 text-left active:bg-raised ${String(i + 1) === s.scene ? 'text-accent' : ''}`}
            >
              <span className="w-8 shrink-0 font-mono text-[13px]">{i + 1}</span>
              <span className="min-w-0 flex-1 text-[15px] leading-snug">{sc.scene_heading}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
