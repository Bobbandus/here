import { useApp } from '../../state/AppState';
import { LINE_TYPE_LABEL } from '../../fountain/parse';
import { APP_LABEL, viewLabel } from '../../state/views';

export function StatusBar() {
  const { state } = useApp();
  if (state.app === 'home') return null;
  const { cursor } = state;

  return (
    <footer
      className="flex h-9 shrink-0 items-center gap-3 overflow-x-auto border-t border-line bg-surface px-3 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-muted sm:gap-5 sm:px-6"
      aria-label="Statusrad"
    >
      <span className="shrink-0 text-text">
        A+ {APP_LABEL[state.app]} · {viewLabel(state.view)}
      </span>
      {state.view === 'write' && (
        <span className="hidden shrink-0 items-center gap-5 sm:flex">
          <span aria-live="polite" className="text-accent">
            {LINE_TYPE_LABEL[cursor.type]}
          </span>
          <span>RAD {cursor.line + 1}</span>
          <span>KOL {cursor.col + 1}</span>
          {cursor.sceneId && <span>{cursor.sceneId}</span>}
        </span>
      )}
      <span className="hidden shrink-0 sm:ml-auto sm:inline">SPARAT LOKALT {state.lastEdited}</span>
      <span className="ml-auto shrink-0 text-text sm:ml-0">FOUNTAIN</span>
    </footer>
  );
}
