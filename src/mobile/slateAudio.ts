import { synthesizeSpeech } from '../shoot/tts';

type Clip = 'beep' | 'quiet' | 'clap';

const SRC: Record<Clip, string> = {
  beep: '/sfx/beep.mp3',
  quiet: '/sfx/voiceoverQuietSlating.mp3',
  clap: '/sfx/clap.mp3',
};

const FALLBACK_MS: Record<Clip, number> = { beep: 700, quiet: 2600, clap: 400 };

// 44 byte tom WAV — ett ljudelement måste ha en källa för att kunna låsas upp.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

const clips = new Map<Clip, HTMLAudioElement>();
let voiceEl: HTMLAudioElement | null = null;
const unlocking = new Map<HTMLAudioElement, Promise<void>>();

function clip(c: Clip): HTMLAudioElement {
  let a = clips.get(c);
  if (!a) {
    a = new Audio(SRC[c]);
    a.preload = 'auto';
    clips.set(c, a);
  }
  return a;
}

function voice(): HTMLAudioElement {
  if (!voiceEl) {
    voiceEl = new Audio(SILENT);
    voiceEl.preload = 'auto';
  }
  return voiceEl;
}

export function preloadSlateAudio() {
  (Object.keys(SRC) as Clip[]).forEach((c) => clip(c).load());
}

export function clipDurationMs(c: Clip): number {
  const d = clip(c).duration;
  return Number.isFinite(d) && d > 0 ? d * 1000 : FALLBACK_MS[c];
}

/**
 * Anropas SYNKRONT i tryckhändelsen. iOS Safari tillåter bara `play()` på ljudelement
 * som redan startats inom en användargest — allt som spelas efter en `await` (tyst-
 * ansägningen, rösten, klappen) blockeras annars tyst. Varje element startas dämpat
 * och pausas direkt, vilket räknas som upplåst resten av sidans livstid.
 */
export function unlockSlateAudio() {
  for (const a of [clip('quiet'), clip('clap'), voice()]) {
    if (unlocking.has(a)) continue;
    a.muted = true;
    const p = a.play();
    const done = Promise.resolve(p)
      .then(() => {
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => undefined)
      .finally(() => {
        a.muted = false;
      });
    unlocking.set(a, done);
  }
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

function playElement(a: HTMLAudioElement, maxMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      a.onended = null;
      a.onerror = null;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(true), maxMs);
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    a.currentTime = 0;
    a.muted = false;
    a.play().catch(() => finish(false));
  });
}

export async function playClip(c: Clip): Promise<boolean> {
  const a = clip(c);
  await unlocking.get(a);
  return playElement(a, clipDurationMs(c) + 1500);
}

/** Förhämtar Puter-rösten (nätverk) — startas parallellt med pipet så det inte blir ett glapp. */
export function prepareOnlineVoice(text: string): Promise<string | null> {
  return synthesizeSpeech(text).catch(() => null);
}

export async function playOnlineVoice(src: string): Promise<boolean> {
  const a = voice();
  await unlocking.get(a);
  a.src = src;
  return playElement(a, 20000);
}

/** Enhetens inbyggda talsyntes — fungerar offline. */
export function speakWithDevice(text: string): Promise<boolean> {
  if (!('speechSynthesis' in window)) return Promise.resolve(false);
  const synth = window.speechSynthesis;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    const v = synth.getVoices().find((x) => x.lang === 'en-US') ?? synth.getVoices().find((x) => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    // Reserv om `onend` aldrig kommer (saknad röst): ungefär normal taltakt, inte mer.
    const timer = setTimeout(() => finish(true), 1000 + text.length * 70);
    synth.cancel();
    synth.speak(u);
  });
}
