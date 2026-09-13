import { useApp, type BibleTab } from '../../state/AppState';
import type { Location } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { Tabs } from '../ui/Tabs';

const TABS: { id: BibleTab; label: string }[] = [
  { id: 'characters', label: 'Karaktärer' },
  { id: 'locations', label: 'Platser' },
  { id: 'notes', label: 'Anteckningar' },
];

const INT_EXT: Location['int_ext'][] = ['INT', 'EXT', 'INT/EXT', 'EST'];

const inlineInput =
  'w-full rounded-btn border border-transparent bg-transparent px-1 -mx-1 outline-none transition-colors duration-150 hover:border-line focus:border-accent';

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-btn text-muted opacity-0 transition-all duration-150 hover:bg-line hover:text-flare focus-visible:opacity-100 group-hover:opacity-100"
    >
      <Icon name="trash" size={12} />
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-1 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted">{text}</p>;
}

export function StoryBible({ onCollapse }: { onCollapse: () => void }) {
  const { state, dispatch, derived } = useApp();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-2 pr-5">
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Dölj story bible"
          className="flex h-8 items-center gap-1 rounded-btn px-2 font-mono text-[0.64rem] text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
        >
          DÖLJ
          <Icon name="chevronRight" size={12} />
        </button>
        <MonoLabel eyebrow>Story bible</MonoLabel>
      </div>

      <Tabs
        label="Story bible"
        idPrefix="bible"
        items={TABS}
        value={state.bibleTab}
        onChange={(tab) => dispatch({ type: 'SET_BIBLE_TAB', tab })}
        className="shrink-0 px-5 pt-3"
      />

      <div role="tabpanel" aria-labelledby={`bible-${state.bibleTab}`} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {state.bibleTab === 'characters' && (
          <>
            <Button variant="quiet" onClick={() => dispatch({ type: 'ADD_CHARACTER' })} className="w-full justify-start">
              <Icon name="plus" size={12} />
              Ny karaktär
            </Button>
            {state.characters.length === 0 && <EmptyHint text="Inga karaktärer. Nya namn föreslås i editorn." />}
            {state.characters.map((c) => {
              const t = derived.characterTotals[c.name.toUpperCase()] ?? { scenes: 0, lines: 0 };
              return (
                <article key={c.id} className="group rounded-panel border border-line bg-raised p-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <input
                      className={`${inlineInput} font-display text-[15px] font-bold`}
                      value={c.name}
                      aria-label="Karaktärens namn"
                      onChange={(e) => dispatch({ type: 'UPDATE_CHARACTER', id: c.id, patch: { name: e.target.value.toUpperCase() } })}
                    />
                    <input
                      className={`${inlineInput} w-14 shrink-0 text-right font-mono text-[0.66rem] text-muted`}
                      value={c.age}
                      placeholder="ÅLDER"
                      aria-label={`Ålder för ${c.name}`}
                      onChange={(e) => dispatch({ type: 'UPDATE_CHARACTER', id: c.id, patch: { age: e.target.value } })}
                    />
                    <DeleteButton label={`Ta bort ${c.name}`} onClick={() => dispatch({ type: 'DELETE_CHARACTER', id: c.id })} />
                  </div>
                  <p className="mt-1.5 font-mono text-[0.64rem] tracking-[0.08em] text-muted">
                    <span className="text-text">{t.scenes}</span> SCENER · <span className="text-text">{t.lines}</span> REPLIKER
                  </p>
                  <textarea
                    rows={2}
                    className={`${inlineInput} mt-2 resize-none text-[12.5px] leading-relaxed text-muted focus:text-text`}
                    value={c.description}
                    placeholder="Beskrivning…"
                    aria-label={`Beskrivning av ${c.name}`}
                    onChange={(e) => dispatch({ type: 'UPDATE_CHARACTER', id: c.id, patch: { description: e.target.value } })}
                  />
                </article>
              );
            })}
          </>
        )}

        {state.bibleTab === 'locations' && (
          <>
            <Button variant="quiet" onClick={() => dispatch({ type: 'ADD_LOCATION' })} className="w-full justify-start">
              <Icon name="plus" size={12} />
              Ny plats
            </Button>
            {state.locations.length === 0 && <EmptyHint text="Inga platser. De föreslås efter INT./EXT. i editorn." />}
            {state.locations.map((l) => {
              const count = derived.scenes.filter((s) => s.location === l.name).length;
              return (
                <article key={l.id} className="group rounded-panel border border-line bg-raised p-4">
                  <div className="flex items-center gap-2">
                    <input
                      className={`${inlineInput} font-display text-[14px] font-bold`}
                      value={l.name}
                      aria-label="Platsens namn"
                      onChange={(e) => dispatch({ type: 'UPDATE_LOCATION', id: l.id, patch: { name: e.target.value.toUpperCase() } })}
                    />
                    <select
                      aria-label={`INT/EXT för ${l.name}`}
                      className="h-5 shrink-0 rounded-full border border-accent/60 bg-transparent px-1.5 font-mono text-[0.6rem] font-bold text-accent outline-none focus:border-accent"
                      value={l.int_ext}
                      onChange={(e) => dispatch({ type: 'UPDATE_LOCATION', id: l.id, patch: { int_ext: e.target.value as Location['int_ext'] } })}
                    >
                      {INT_EXT.map((v) => (
                        <option key={v} value={v} className="bg-surface">
                          {v}
                        </option>
                      ))}
                    </select>
                    <DeleteButton label={`Ta bort ${l.name}`} onClick={() => dispatch({ type: 'DELETE_LOCATION', id: l.id })} />
                  </div>
                  <p className="mt-1.5 font-mono text-[0.64rem] tracking-[0.08em] text-muted">
                    <span className="text-text">{count}</span> SCENER
                  </p>
                  <textarea
                    rows={2}
                    className={`${inlineInput} mt-2 resize-none text-[12.5px] leading-relaxed text-muted focus:text-text`}
                    value={l.description}
                    placeholder="Beskrivning…"
                    aria-label={`Beskrivning av ${l.name}`}
                    onChange={(e) => dispatch({ type: 'UPDATE_LOCATION', id: l.id, patch: { description: e.target.value } })}
                  />
                </article>
              );
            })}
          </>
        )}

        {state.bibleTab === 'notes' && (
          <>
            <Button variant="quiet" onClick={() => dispatch({ type: 'ADD_NOTE' })} className="w-full justify-start">
              <Icon name="plus" size={12} />
              Ny anteckning
            </Button>
            {state.notes.map((n) => (
              <article key={n.id} className="group rounded-panel border border-gold/35 bg-gold/[0.08] p-4">
                <div className="flex items-center gap-2">
                  <input
                    className={`${inlineInput} font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-gold`}
                    value={n.title}
                    aria-label="Anteckningens rubrik"
                    onChange={(e) => dispatch({ type: 'UPDATE_NOTE', id: n.id, patch: { title: e.target.value } })}
                  />
                  <DeleteButton label={`Ta bort anteckningen ${n.title}`} onClick={() => dispatch({ type: 'DELETE_NOTE', id: n.id })} />
                </div>
                <textarea
                  rows={3}
                  className={`${inlineInput} mt-1.5 resize-none text-[12.5px] leading-relaxed text-text`}
                  value={n.body}
                  placeholder="Skriv en anteckning…"
                  aria-label={`Anteckning: ${n.title}`}
                  onChange={(e) => dispatch({ type: 'UPDATE_NOTE', id: n.id, patch: { body: e.target.value } })}
                />
              </article>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
