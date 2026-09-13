import { useApp } from '../../state/AppState';
import { Button } from '../ui/Button';
import { MonoLabel } from '../ui/MonoLabel';

export function EmptyScenes() {
  const { dispatch } = useApp();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <MonoLabel eyebrow>Inga scener ännu</MonoLabel>
      <p className="max-w-[440px] leading-relaxed text-muted">
        Planeringen bygger på scenerna i manuset. Skriv en scenrubrik, till exempel{' '}
        <span className="font-mono text-text">INT. KÖKET – DAG</span>, i A+ Write så dyker scenen upp här.
      </p>
      <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SET_VIEW', view: 'write' })}>
        Öppna A+ Write →
      </Button>
    </div>
  );
}
