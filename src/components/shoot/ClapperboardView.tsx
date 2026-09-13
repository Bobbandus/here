import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useApp } from '../../state/AppState';
import { shotLetter } from '../plan/shots';
import { natoSpell } from '../../shoot/nato';
import { playBeep, playClap, playQuietSlating } from '../../shoot/audio';
import { speak } from '../../shoot/tts';
import { Icon } from '../ui/Icon';

type Phase = 'idle' | 'beep' | 'quiet' | 'announce' | 'clap' | 'hold';

const FPS = 25;
const STRIPE_COLORS = ['#1a8f52', '#f4c548', '#2f8fd6', '#c62b3a', '#e9e4e0', '#8f8b86', '#2a2a2a'];

const stripeStyle: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(115deg, ${STRIPE_COLORS.map(
    (c, i) => `${c} ${i * (100 / STRIPE_COLORS.length)}%, ${c} ${(i + 1) * (100 / STRIPE_COLORS.length)}%`,
  ).join(', ')})`,
};

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

function formatTimecode(d: Date): string {
  const frames = Math.floor((d.getMilliseconds() / 1000) * FPS) % FPS;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(frames)}`;
}

function spokenTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function spokenDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Läsbart datum + tid, tryckt direkt på klapperbrädan — synligt även utan internet/röst. */
function boardDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function boardTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const statusLabel: Record<Phase, string> = {
  idle: '',
  beep: '···',
  quiet: 'QUIET ON SET',
  announce: 'SLATING…',
  clap: 'CLAP!',
  hold: 'CLAP!',
};

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
  onDec: () => void;
  onInc: () => void;
  disabled: boolean;
  decLabel: string;
  incLabel: string;
}

function StatRow({ label, value, sub, onDec, onInc, disabled, decLabel, incLabel }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-btn border border-line bg-raised/60 px-3 py-2">
      <span className="micro w-12 shrink-0 text-muted">{label}</span>
      <button
        type="button"
        aria-label={decLabel}
        disabled={disabled}
        onClick={onDec}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-surface hover:text-text disabled:opacity-30"
      >
        <Icon name="chevronLeft" size={14} />
      </button>
      <span className="flex-1 text-center leading-none">
        <span className="font-black text-[1.7rem] tracking-[-0.02em]">{value}</span>
        {sub && <span className="ml-1.5 font-mono text-[0.62rem] uppercase tracking-[0.08em] text-accent">{sub}</span>}
      </span>
      <button
        type="button"
        aria-label={incLabel}
        disabled={disabled}
        onClick={onInc}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-surface hover:text-text disabled:opacity-30"
      >
        <Icon name="chevronRight" size={14} />
      </button>
    </div>
  );
}

function StrikeToggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: readonly [T, T];
  value: T;
  onChange: (v: T) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3 font-mono text-[0.78rem] font-bold tracking-[0.04em]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
          className={`disabled:cursor-not-allowed ${value === opt ? 'text-text' : 'text-muted line-through decoration-2'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** En rad på själva brädans "tryckta" fält — inte redigerbar där, bara en spegling av sidopanelens värde. */
function BoardStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
      <span className="micro text-black/50">{label}</span>
      <span className="font-black text-[3rem] leading-none text-black">{value}</span>
      {sub && <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.08em] text-black/60">{sub}</span>}
    </div>
  );
}

export function ClapperboardView() {
  const { state, dispatch, derived } = useApp();
  const scenes = derived.scenes;

  const [sceneLabel, setSceneLabel] = useState(() => {
    const idx = scenes.findIndex((s) => s.scene_id === state.selectedSceneId);
    return String(idx >= 0 ? idx + 1 : 1);
  });
  const [setupIndex, setSetupIndex] = useState(0);
  const [take, setTake] = useState(1);
  const [dayNight, setDayNight] = useState<'DAY' | 'NIGHT'>('DAY');
  const [intExt, setIntExt] = useState<'INT' | 'EXT'>('INT');
  const [sync, setSync] = useState<'SYNC' | 'MOS'>('SYNC');
  const [phase, setPhase] = useState<Phase>('idle');
  const [armUp, setArmUp] = useState(false);
  const [audioWarning, setAudioWarning] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [frozen, setFrozen] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement);
  const [panelHidden, setPanelHidden] = useState(false);

  const runToken = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => void (mounted.current = false);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 / FPS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const setupCode = shotLetter(setupIndex);
  const busy = phase !== 'idle';

  const newSetup = () => {
    if (busy) return;
    setSetupIndex((i) => i + 1);
    setTake(1);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  const exit = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    dispatch({ type: 'SET_APP', app: 'home' });
  };

  async function runSlate() {
    if (busy) return;
    const token = ++runToken.current;
    const stillCurrent = () => mounted.current && runToken.current === token;

    setAudioWarning(false);
    setFrozen(null);
    setArmUp(false);
    setPhase('beep');
    try {
      await playBeep();
    } catch {
      setAudioWarning(true);
    }
    if (!stillCurrent()) return;

    setPhase('quiet');
    try {
      await playQuietSlating();
    } catch {
      setAudioWarning(true);
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!stillCurrent()) return;

    setPhase('announce');
    setArmUp(true);
    const announceMoment = new Date();
    const text = `Date, ${spokenDate(announceMoment)}. Time, ${spokenTime(announceMoment)}. Scene ${sceneLabel} ${natoSpell(setupCode)}. Take ${take}.`;
    try {
      await speak(text);
    } catch {
      setAudioWarning(true);
      await new Promise((r) => setTimeout(r, 1200));
    }
    if (!stillCurrent()) return;

    setFrozen(formatTimecode(new Date()));
    setArmUp(false);
    setPhase('clap');
    try {
      await playClap();
    } catch {
      setAudioWarning(true);
    }
    if (!stillCurrent()) return;

    setPhase('hold');
    await new Promise((r) => setTimeout(r, 1200));
    if (!stillCurrent()) return;
    setPhase('idle');
    setFrozen(null);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        void runSlate();
      } else if (e.key === 'Escape' && !busy) {
        exit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneLabel, setupIndex, take, busy]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ink text-text">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={exit}
          aria-label="Till startsidan"
          className="flex h-9 w-9 items-center justify-center rounded-btn border border-line text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <span className="min-w-0 truncate font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">
          {state.project.title} · Klapperbräda
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <select
            className="field h-9 w-[200px] font-mono text-[11px]"
            aria-label="Hämta scennummer från manuset"
            value=""
            disabled={busy}
            onChange={(e) => {
              const idx = scenes.findIndex((s) => s.scene_id === e.target.value);
              if (idx >= 0) {
                setSceneLabel(String(idx + 1));
                const ie = scenes[idx].int_ext;
                if (ie === 'INT' || ie === 'EXT') setIntExt(ie);
              }
            }}
          >
            <option value="" disabled>
              Hämta scen…
            </option>
            {scenes.map((s, i) => (
              <option key={s.scene_id} value={s.scene_id}>
                {i + 1} — {s.scene_heading}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPanelHidden((h) => !h)}
            aria-label={panelHidden ? 'Visa panel' : 'Dölj panel (filma)'}
            aria-pressed={panelHidden}
            className={`flex h-9 w-9 items-center justify-center rounded-btn border border-line transition-colors duration-150 hover:bg-raised hover:text-text ${
              panelHidden ? 'text-accent' : 'text-muted'
            }`}
          >
            <Icon name="panel" size={16} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Avsluta helskärm' : 'Helskärm'}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-line text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
          >
            <Icon name={fullscreen ? 'close' : 'focus'} size={16} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-6 px-6 pb-6 max-[1000px]:flex-col max-[1000px]:overflow-y-auto">
        <button
          type="button"
          onClick={() => void runSlate()}
          disabled={busy}
          aria-label="Slatea"
          className={`group flex h-full max-h-[620px] min-h-0 w-full flex-col disabled:cursor-default max-[1000px]:max-h-[420px] max-[1000px]:shrink-0 ${
            panelHidden ? 'max-w-[880px]' : 'max-w-[720px]'
          }`}
        >
          <div className="relative h-[11%] min-h-[32px] w-full overflow-visible">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-full w-full origin-bottom-left rounded-t-[6px] border border-b-0 border-black/40"
              style={{
                ...stripeStyle,
                transform: `rotate(${armUp ? -18 : 0}deg)`,
                transition: armUp ? 'transform 420ms cubic-bezier(.2,.7,.3,1)' : 'transform 90ms cubic-bezier(.5,0,1,1)',
                boxShadow: '0 -2px 10px rgba(0,0,0,.4)',
              }}
            />
          </div>
          {/* Kroppen är ljus/"papper" som en riktig slate — de tryckta fälten är inte redigerbara här. */}
          <div className="flex flex-1 flex-col rounded-b-panel border border-t-0 border-black/40 bg-paper transition-colors duration-150 group-active:brightness-95">
            <div aria-hidden="true" className="h-6 shrink-0 rounded-[3px] border border-black/40" style={stripeStyle} />

            <div className="flex items-center justify-between border-b border-black/15 px-6 py-2 font-mono text-[0.78rem] font-bold uppercase tracking-[0.06em] text-black/70">
              <span>{boardDate(now)}</span>
              <span>{boardTime(now)}</span>
            </div>

            <div className="flex flex-1 divide-x divide-black/15">
              <BoardStat label="SCENE" value={sceneLabel} />
              <BoardStat label="SETUP" value={setupCode} sub={natoSpell(setupCode)} />
              <BoardStat label="TAKE" value={String(take)} />
            </div>

            <div className="flex items-center justify-center border-y border-black/15 bg-black py-2.5">
              <span
                className="font-mono text-[1.7rem] font-bold tabular-nums tracking-[0.04em]"
                style={{ color: '#ff4b3e', textShadow: '0 0 12px rgba(255,75,62,.5)' }}
              >
                {frozen ?? formatTimecode(now)}
              </span>
            </div>

            <div className="flex h-11 items-center justify-center py-3">
              {statusLabel[phase] && (
                <span
                  className="text-center font-mono text-[1.3rem] font-bold uppercase leading-tight tracking-[0.08em]"
                  style={{ color: '#d81f10' }}
                >
                  {statusLabel[phase]}
                </span>
              )}
            </div>
          </div>
        </button>

        <div
          className={`${panelHidden ? 'hidden' : 'flex'} h-full max-h-[620px] w-[320px] shrink-0 flex-col justify-center gap-3 max-[1000px]:h-auto max-[1000px]:max-h-none max-[1000px]:w-full max-[1000px]:max-w-[420px]`}
        >
          <StatRow
            label="SCENE"
            value={sceneLabel}
            onDec={() => setSceneLabel((s) => String(Math.max(1, Number(s) - 1 || 1)))}
            onInc={() => setSceneLabel((s) => String((Number(s) || 0) + 1))}
            disabled={busy}
            decLabel="Föregående scen"
            incLabel="Nästa scen"
          />
          <StatRow
            label="SETUP"
            value={setupCode}
            sub={natoSpell(setupCode)}
            onDec={() => setSetupIndex((i) => Math.max(0, i - 1))}
            onInc={newSetup}
            disabled={busy}
            decLabel="Föregående kameravinkel"
            incLabel="Ny kameravinkel (nollställer tagning)"
          />
          <StatRow
            label="TAKE"
            value={String(take)}
            onDec={() => setTake((t) => Math.max(1, t - 1))}
            onInc={() => setTake((t) => t + 1)}
            disabled={busy}
            decLabel="Föregående tagning"
            incLabel="Nästa tagning"
          />

          <div className="mt-1 flex items-center justify-between rounded-btn border border-line bg-raised/60 px-4 py-3">
            <StrikeToggle label="Day or night" options={['DAY', 'NIGHT'] as const} value={dayNight} onChange={setDayNight} disabled={busy} />
          </div>
          <div className="flex items-center justify-between rounded-btn border border-line bg-raised/60 px-4 py-3">
            <StrikeToggle label="Interior or exterior" options={['INT', 'EXT'] as const} value={intExt} onChange={setIntExt} disabled={busy} />
            <StrikeToggle label="Sync sound or MOS" options={['SYNC', 'MOS'] as const} value={sync} onChange={setSync} disabled={busy} />
          </div>

          {audioWarning && (
            <p className="text-center font-mono text-[0.62rem] uppercase tracking-[0.06em] text-gold">
              Ljud/röst kunde inte spelas — sekvensen fortsätter ändå
            </p>
          )}

          <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.08em] text-muted">
            Mellanslag eller tryck på brädan för att slatea
          </p>
        </div>
      </div>
    </div>
  );
}
