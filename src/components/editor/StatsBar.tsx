import { useApp } from '../../state/AppState';

export function StatsBar() {
  const { state, derived } = useApp();
  const items = [
    { text: `${derived.scenes.length} SCENER`, emphasis: true },
    { text: `${Math.round(derived.totalPages)} SID`, emphasis: true },
    { text: `~${derived.runtimeMin} MIN`, emphasis: true },
    { text: `${derived.characterCount} KARAKTÄRER`, emphasis: false },
    { text: `SENAST ÄNDRAD ${state.lastEdited}`, emphasis: false, hideOnMobile: true },
  ];
  return (
    <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-t border-line bg-surface px-2 py-1.5 font-mono text-[0.68rem] tracking-[0.08em] text-muted">
      {items.map((it, i) => (
        <span key={it.text} className={`flex items-center ${it.hideOnMobile ? 'hidden sm:flex' : ''}`}>
          {i > 0 && (
            <span aria-hidden="true" className="px-2">
              ·
            </span>
          )}
          <span className={it.emphasis ? 'text-text' : undefined}>{it.text}</span>
        </span>
      ))}
    </div>
  );
}
