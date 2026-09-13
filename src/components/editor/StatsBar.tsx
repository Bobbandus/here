import { useApp } from '../../state/AppState';

export function StatsBar() {
  const { state, derived } = useApp();
  const items = [
    `${derived.scenes.length} SCENER`,
    `${Math.round(derived.totalPages)} SID`,
    `~${derived.runtimeMin} MIN`,
    `${derived.characterCount} KARAKTÄRER`,
    `SENAST ÄNDRAD ${state.lastEdited}`,
  ];
  return (
    <div className="flex h-10 shrink-0 items-center justify-center border-t border-line bg-surface font-mono text-[0.68rem] tracking-[0.08em] text-muted">
      {items.map((t, i) => (
        <span key={t} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className="px-2">
              ·
            </span>
          )}
          <span className={i < 3 ? 'text-text' : undefined}>{t}</span>
        </span>
      ))}
    </div>
  );
}
