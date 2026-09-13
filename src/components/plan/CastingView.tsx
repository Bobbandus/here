import { useRef, type ChangeEvent } from 'react';
import { useApp } from '../../state/AppState';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { readAndResizeImage } from './imageUtils';

function RefImage({ src, onRemove, label }: { src: string; onRemove: () => void; label: string }) {
  return (
    <li className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-media border border-line bg-raised">
      <img src={src} alt={label} className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label={`Ta bort referensbild: ${label}`}
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-text opacity-0 transition-opacity duration-150 hover:bg-flare group-hover:opacity-100"
      >
        <Icon name="close" size={12} />
      </button>
    </li>
  );
}

function UploadButton({ label, onFile, compact }: { label: string; onFile: (file: File) => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={
          compact
            ? 'flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-media border border-dashed border-line text-muted transition-colors duration-150 hover:border-accent/50 hover:text-text'
            : 'flex h-9 items-center gap-2 rounded-btn border border-line px-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted transition-colors duration-150 hover:bg-raised hover:text-text'
        }
      >
        <Icon name={compact ? 'upload' : 'image'} size={compact ? 18 : 13} />
        {!compact && label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}

export function CastingView() {
  const { state, derived, dispatch } = useApp();
  const characters = state.characters;
  const active = characters.find((c) => c.name === state.selectedCharacter) ?? characters[0];
  const entry = active ? state.project.casting[active.name] : undefined;
  const referenceImages = entry?.referenceImages ?? [];
  const candidates = entry?.candidates ?? [];

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <MonoLabel eyebrow>Casting</MonoLabel>
        <p className="max-w-[420px] leading-relaxed text-muted">
          Ingen karaktär i story bible ännu. Lägg till karaktärer i A+ Write för att börja sätta ihop casting.
        </p>
      </div>
    );
  }

  const onRefUpload = async (file: File) => {
    try {
      const dataUrl = await readAndResizeImage(file);
      dispatch({ type: 'ADD_REF_IMAGE', character: active.name, dataUrl });
    } catch {
      dispatch({ type: 'TOAST', message: 'Kunde inte läsa bilden' });
    }
  };

  const onCandidatePhoto = async (id: string, file: File) => {
    try {
      const dataUrl = await readAndResizeImage(file);
      dispatch({ type: 'UPDATE_CANDIDATE', character: active.name, id, patch: { photo: dataUrl } });
    } catch {
      dispatch({ type: 'TOAST', message: 'Kunde inte läsa bilden' });
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)]">
      <aside aria-label="Karaktärer" className="flex min-h-0 flex-col border-r border-line bg-surface">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <MonoLabel eyebrow>Roller</MonoLabel>
          <span className="font-mono text-[0.64rem] text-muted">{characters.length}</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1.5">
          {characters.map((c) => {
            const t = derived.characterTotals[c.name.toUpperCase()] ?? { scenes: 0, lines: 0 };
            const ce = state.project.casting[c.name];
            const chosen = ce?.candidates.find((cand) => cand.chosen);
            const isActive = c.id === active.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => dispatch({ type: 'SELECT_CHARACTER', name: c.name })}
                  className={`relative flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-150 ${
                    isActive ? 'bg-raised' : 'hover:bg-raised/60'
                  }`}
                >
                  {isActive && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[2px] bg-accent" />}
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-bold">{c.name}</span>
                    <span className="block font-mono text-[0.64rem] text-muted">{t.lines} REPLIKER</span>
                  </span>
                  {chosen ? <Chip tone="accentOutline">Vald</Chip> : ce?.candidates.length ? <Chip tone="goldOutline">{ce.candidates.length}</Chip> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-0 flex-col overflow-y-auto">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-8 py-6">
          <div>
            <MonoLabel eyebrow>Casting</MonoLabel>
            <h2 className="mt-2 flex items-center gap-3 font-black text-[1.9rem] leading-[1.02] tracking-[-0.03em]">
              <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: active.color }} />
              {active.name}
            </h2>
            {active.description && <p className="mt-2 max-w-[520px] text-muted">{active.description}</p>}
          </div>
        </header>

        <div className="flex flex-col gap-8 px-8 py-6">
          <section aria-labelledby="ref-title">
            <div className="flex items-center justify-between">
              <MonoLabel as="h3" id="ref-title" tone="muted">
                Referensbilder — hur rollen ska se ut
              </MonoLabel>
            </div>
            <ul className="mt-3 flex flex-wrap gap-3">
              {referenceImages.map((src, i) => (
                <RefImage
                  key={i}
                  src={src}
                  label={`${active.name} referens ${i + 1}`}
                  onRemove={() => dispatch({ type: 'REMOVE_REF_IMAGE', character: active.name, index: i })}
                />
              ))}
              <li>
                <UploadButton label="Ladda upp referens" onFile={onRefUpload} compact />
              </li>
            </ul>
          </section>

          <section aria-labelledby="cand-title">
            <div className="flex items-center justify-between">
              <MonoLabel as="h3" id="cand-title" tone="muted">
                Kandidater
              </MonoLabel>
              <Button variant="ghost" onClick={() => dispatch({ type: 'ADD_CANDIDATE', character: active.name })}>
                <Icon name="plus" size={12} />
                Lägg till kandidat
              </Button>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-3 flex flex-col items-center gap-3 rounded-panel border border-dashed border-line p-10 text-center">
                <p className="text-muted">Inga kandidater ännu. Lägg till namn och bild när provfilmning börjar.</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-4">
                {candidates.map((cand) => (
                  <article key={cand.id} className={`card flex flex-col gap-3 p-4 ${cand.chosen ? 'border-accent' : ''}`}>
                    <div className="flex items-center gap-3">
                      {cand.photo ? (
                        <img src={cand.photo} alt={cand.name} className="h-16 w-16 shrink-0 rounded-media object-cover" />
                      ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-media border border-dashed border-line text-muted">
                          <Icon name="portrait" size={22} />
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <input
                          className="w-full truncate rounded-btn border border-transparent bg-transparent px-1 -mx-1 font-display text-[13.5px] font-bold outline-none transition-colors duration-150 hover:border-line focus:border-accent"
                          value={cand.name}
                          aria-label="Kandidatens namn"
                          onChange={(e) => dispatch({ type: 'UPDATE_CANDIDATE', character: active.name, id: cand.id, patch: { name: e.target.value } })}
                        />
                        <UploadButton label={cand.photo ? 'Byt bild' : 'Lägg till bild'} onFile={(f) => onCandidatePhoto(cand.id, f)} />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      className="w-full resize-none rounded-btn border border-transparent bg-transparent px-1 -mx-1 text-[12.5px] leading-relaxed text-muted outline-none transition-colors duration-150 hover:border-line focus:border-accent focus:text-text"
                      placeholder="Anteckningar…"
                      value={cand.notes}
                      aria-label={`Anteckningar om ${cand.name}`}
                      onChange={(e) => dispatch({ type: 'UPDATE_CANDIDATE', character: active.name, id: cand.id, patch: { notes: e.target.value } })}
                    />
                    <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                      <button
                        type="button"
                        aria-pressed={cand.chosen}
                        onClick={() => dispatch({ type: 'SET_CHOSEN_CANDIDATE', character: active.name, id: cand.id })}
                        className={`h-8 rounded-full border px-3 font-mono text-[0.64rem] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
                          cand.chosen ? 'border-accent bg-accent text-accentInk' : 'border-line text-muted hover:border-accent/50 hover:text-text'
                        }`}
                      >
                        {cand.chosen ? 'Vald ✓' : 'Markera vald'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Ta bort kandidaten ${cand.name}`}
                        onClick={() => dispatch({ type: 'DELETE_CANDIDATE', character: active.name, id: cand.id })}
                        className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-flare"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-4 text-[0.7rem] text-muted">
              En vald kandidat dyker upp som alternativ i scenens cast-lista under Scen i A+ Plan.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
