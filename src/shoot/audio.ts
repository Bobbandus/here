function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Ljudet tog för lång tid')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function playFile(src: string, timeoutMs = 4000): Promise<void> {
  return withTimeout(
    new Promise<void>((resolve, reject) => {
      const audio = new Audio(src);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error(`Kunde inte spela ${src}`));
      audio.play().catch(reject);
    }),
    timeoutMs,
  );
}

/** Uppmärksamhetspip — riktig ljudfil (public/sfx/beep.mp3), inte syntetiserat. */
export function playBeep(): Promise<void> {
  return playFile('/sfx/beep.mp3');
}

/** Klappljudet — riktig ljudfil (public/sfx/clap.mp3). */
export function playClap(): Promise<void> {
  return playFile('/sfx/clap.mp3');
}

/** "Tyst — vi slatear"-ansägningen — riktig, förinspelad ljudfil (public/sfx/voiceoverQuietSlating.mp3), inte TTS. */
export function playQuietSlating(): Promise<void> {
  return playFile('/sfx/voiceoverQuietSlating.mp3');
}
