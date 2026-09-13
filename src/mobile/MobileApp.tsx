import { useEffect, useState } from 'react';
import { useApp } from '../state/AppState';
import type { AppScene } from '../types';
import { Toast } from '../components/shell/Toast';
import { Icon, type IconName } from '../components/ui/Icon';
import { ProjectsTab } from './ProjectsTab';
import { ScenesTab } from './ScenesTab';
import { ScriptTab } from './ScriptTab';
import { SlateTab, type SlatePreset } from './SlateTab';

type Tab = 'script' | 'scenes' | 'slate' | 'projects';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'script', label: 'Manus', icon: 'write' },
  { id: 'scenes', label: 'Scener', icon: 'scene' },
  { id: 'slate', label: 'Klappa', icon: 'clapper' },
  { id: 'projects', label: 'Projekt', icon: 'dashboard' },
];

const TAB_KEY = 'aplus.mobile.tab';

function initialTab(): Tab {
  try {
    const t = localStorage.getItem(TAB_KEY);
    if (t && TABS.some((x) => x.id === t)) return t as Tab;
  } catch {
    /* privat läge */
  }
  return 'script';
}

/**
 * Mobilappen på /mobile. Egen komponentträd, byggt för telefon från början — delar
 * bara data (AppState), manusparsern och ljudfilerna med desktopversionen.
 */
export function MobileApp() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [preset, setPreset] = useState<SlatePreset | null>(null);
  const [filming, setFilming] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* privat läge */
    }
    if (tab !== 'slate') setFilming(false);
  }, [tab]);

  const active: Tab = state.hasProject ? tab : 'projects';

  const slateScene = (scene: AppScene, number: number) => {
    const night = /NATT|KVÄLL/u.test((scene.time_of_day ?? '').toUpperCase());
    setPreset({
      scene: String(number),
      intExt: scene.int_ext === 'INT' || scene.int_ext === 'EXT' ? scene.int_ext : null,
      dayNight: night ? 'NIGHT' : 'DAY',
      nonce: Date.now(),
    });
    setTab('slate');
  };

  return (
    <div className="flex h-full w-full flex-col bg-ink text-text">
      <main className="relative min-h-0 flex-1">
        {active === 'script' && <ScriptTab />}
        {active === 'scenes' && <ScenesTab onSlate={slateScene} />}
        {active === 'slate' && <SlateTab preset={preset} filming={filming} setFilming={setFilming} />}
        {active === 'projects' && <ProjectsTab onOpened={() => setTab('script')} />}
      </main>

      {!filming && (
        <nav
          aria-label="Flikar"
          className={`grid h-[62px] shrink-0 grid-cols-4 border-t border-line bg-surface ${active === 'slate' ? 'landscape:hidden' : ''}`}
        >
          {TABS.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                disabled={!state.hasProject && t.id !== 'projects'}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center gap-1 disabled:opacity-30 ${on ? 'text-accent' : 'text-muted'}`}
              >
                <Icon name={t.icon} size={22} />
                <span className="text-[11px] font-bold">{t.label}</span>
              </button>
            );
          })}
        </nav>
      )}
      <Toast />
    </div>
  );
}
