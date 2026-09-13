// Röstuppläsningen för klapperbrädan är appens enda nätverksberoende funktion —
// resten av A+ är helt offline. Puter.js (https://js.puter.com) körs helt i
// webbläsaren utan API-nycklar eller backend och laddas bara in första gången
// någon faktiskt trycker på "Klappa", så Write/Plan/Shoot i övrigt förblir
// nätverksfria. Misslyckas laddningen eller uppläsningen (offline, blockerat
// skript) kastas felet vidare så klappsekvensen kan hoppa över rösten och ändå
// pipa/klappa/frysa tidskoden som vanligt.

interface PuterTts {
  ai: {
    txt2speech: (text: string, language?: string) => Promise<HTMLAudioElement>;
  };
}

declare global {
  interface Window {
    puter?: PuterTts;
  }
}

let loadPromise: Promise<void> | null = null;

function loadPuter(): Promise<void> {
  if (window.puter) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Kunde inte ladda Puter.js'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tidsgräns för röstuppläsning överskreds')), ms);
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

/**
 * Läser upp text via Puter.js text-till-tal och väntar in att uppspelningen är klar.
 * Första gången någon på riktigt öppnar Puter kan de behöva godkänna en engångsruta
 * (deras eget samtycke för molntjänsten) — om ingen svarar inom tidsgränsen ger det
 * bara upp istället för att låta hela klappsekvensen hänga sig på obestämd tid.
 */
export async function speak(text: string, language = 'en-US', timeoutMs = 5000): Promise<void> {
  await withTimeout(loadPuter(), timeoutMs);
  if (!window.puter) throw new Error('Puter.js är inte tillgängligt');
  const audio = await withTimeout(window.puter.ai.txt2speech(text, language), timeoutMs);
  await withTimeout(
    new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Uppspelning misslyckades'));
      audio.play().catch(reject);
    }),
    timeoutMs,
  );
}
