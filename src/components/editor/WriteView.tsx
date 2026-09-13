import { useState } from 'react';
import { useApp } from '../../state/AppState';
import { useMediaQuery } from '../ui/useMediaQuery';
import { Icon } from '../ui/Icon';
import { SceneRail } from './SceneRail';
import { ScriptEditor } from './ScriptEditor';
import { StatsBar } from './StatsBar';
import { StoryBible } from './StoryBible';

function CollapsedColumn({ label, side, onOpen }: { label: string; side: 'left' | 'right'; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Visa ${label.toLowerCase()}`}
      className="flex h-full w-full flex-col items-center gap-3 pt-3 text-muted transition-colors duration-150 hover:bg-raised hover:text-text focus-visible:outline-offset-[-2px]"
    >
      <Icon name={side === 'left' ? 'chevronRight' : 'chevronLeft'} size={14} />
      <span className="micro [writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}

export function WriteView() {
  const { state, dispatch } = useApp();
  const wide = useMediaQuery('(min-width: 1100px)');
  // Under 1100 px kollapsar kolumnerna automatiskt men kan fortfarande öppnas lokalt.
  const [narrow, setNarrow] = useState({ left: false, right: false });

  const leftOpen = wide ? state.leftOpen : narrow.left;
  const rightOpen = wide ? state.rightOpen : narrow.right;
  const toggleLeft = () => (wide ? dispatch({ type: 'TOGGLE_LEFT' }) : setNarrow((n) => ({ ...n, left: !n.left })));
  const toggleRight = () => (wide ? dispatch({ type: 'TOGGLE_RIGHT' }) : setNarrow((n) => ({ ...n, right: !n.right })));

  return (
    <div
      className="grid h-full min-h-0"
      style={{ gridTemplateColumns: `${leftOpen ? 284 : 40}px minmax(0,1fr) ${rightOpen ? 320 : 40}px` }}
    >
      <aside aria-label="Scenlista" className="min-h-0 border-r border-line bg-surface">
        {leftOpen ? <SceneRail onCollapse={toggleLeft} /> : <CollapsedColumn label="Scener" side="left" onOpen={toggleLeft} />}
      </aside>

      <section aria-label="Editor" className="flex min-h-0 min-w-0 flex-col">
        <ScriptEditor key={state.project.id} />
        <StatsBar />
      </section>

      <aside aria-label="Story bible" className="min-h-0 border-l border-line bg-surface">
        {rightOpen ? (
          <StoryBible onCollapse={toggleRight} />
        ) : (
          <CollapsedColumn label="Story bible" side="right" onOpen={toggleRight} />
        )}
      </aside>
    </div>
  );
}
