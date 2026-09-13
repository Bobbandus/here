import { useState } from 'react';
import { useApp } from '../../state/AppState';
import { MobileWriteView } from '../editor/MobileWriteView';
import { ClapperboardView } from '../shoot/ClapperboardView';
import { Icon } from '../ui/Icon';

type Tool = 'write' | 'shoot';

/**
 * Egen ingång på /mobile — inte "samma app fast smal skärm". Ingen sidebar, ingen
 * toppbar, inget hemskärmsraster: rakt in i det som faktiskt fungerar på en telefon
 * (skrivvyn eller klapperbrädan), med en liten växlare mellan de två. Kräver
 * `vercel.json`s SPA-rewrite för att fungera vid direktnavigering/omladdning —
 * annars 404:ar Vercel på en URL utan matchande statisk fil.
 */
export function MobileApp() {
  const { state, dispatch } = useApp();
  const [tool, setTool] = useState<Tool>('write');

  if (!state.hasProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-ink px-8 text-center text-text">
        <span className="font-black text-[40px] leading-none tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <p className="text-muted">Inget projekt valt ännu. Öppna appen på en större skärm först för att skapa ett.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-ink">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-line bg-surface px-2">
        <span className="mr-1 shrink-0 pl-1 font-black text-[15px] leading-none tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <button
          type="button"
          aria-pressed={tool === 'write'}
          onClick={() => setTool('write')}
          className={`flex h-8 items-center gap-1.5 rounded-btn px-3 font-mono text-[0.68rem] font-bold tracking-[0.1em] transition-colors duration-150 ${
            tool === 'write' ? 'bg-raised text-accent' : 'text-muted hover:text-text'
          }`}
        >
          <Icon name="write" size={13} />
          SKRIV
        </button>
        <button
          type="button"
          aria-pressed={tool === 'shoot'}
          onClick={() => setTool('shoot')}
          className={`flex h-8 items-center gap-1.5 rounded-btn px-3 font-mono text-[0.68rem] font-bold tracking-[0.1em] transition-colors duration-150 ${
            tool === 'shoot' ? 'bg-raised text-accent' : 'text-muted hover:text-text'
          }`}
        >
          <Icon name="clapper" size={13} />
          KLAPPA
        </button>
        <span className="min-w-0 flex-1 truncate px-2 text-right font-mono text-[0.64rem] text-muted">
          {state.project.title}
        </span>
        <button
          type="button"
          aria-label="Till fullständiga appen"
          onClick={() => dispatch({ type: 'SET_APP', app: 'home' })}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted hover:bg-raised hover:text-text"
          title="Full app (kräver större skärm)"
        >
          <Icon name="dashboard" size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1">{tool === 'write' ? <MobileWriteView /> : <ClapperboardView />}</div>
    </div>
  );
}
