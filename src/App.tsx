import { useEffect } from 'react';
import { useApp } from './state/AppState';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { StatusBar } from './components/shell/StatusBar';
import { GrainOverlay } from './components/shell/GrainOverlay';
import { CommandPalette } from './components/shell/CommandPalette';
import { SettingsDialog } from './components/shell/SettingsDialog';
import { Toast } from './components/shell/Toast';
import { HomeView } from './components/home/HomeView';
import { NewProjectDialog } from './components/home/NewProjectDialog';
import { WriteOverview } from './components/dashboard/WriteOverview';
import { PlanOverview } from './components/dashboard/PlanOverview';
import { WriteView } from './components/editor/WriteView';
import { ScriptEditor } from './components/editor/ScriptEditor';
import { SceneView } from './components/scene/SceneView';
import { ShotlistView } from './components/plan/ShotlistView';
import { ShootDaysView } from './components/plan/ShootDaysView';
import { CastingView } from './components/plan/CastingView';
import { GearView } from './components/plan/GearView';
import { PipelineBoard } from './components/pipeline/PipelineBoard';
import { ClapperboardView } from './components/shoot/ClapperboardView';

export default function App() {
  const { state, dispatch } = useApp();
  const inApp = state.app !== 'home' && state.hasProject;
  const focusActive = inApp && state.view === 'write' && state.focusMode;
  const shootImmersive = inApp && state.view === 'shoot';
  const anyModalOpen = state.paletteOpen || state.newProjectOpen || state.settingsOpen || state.ai !== null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod) {
        const key = e.key.toLowerCase();
        if (key === 's') {
          e.preventDefault();
          dispatch({ type: 'TOAST', message: 'Sparat lokalt i webbläsaren' });
          return;
        }
        if (key === 'k') {
          e.preventDefault();
          dispatch({ type: 'SET_PALETTE', open: !state.paletteOpen });
          return;
        }
        if (e.key === '.' && inApp && state.view === 'write') {
          e.preventDefault();
          dispatch({ type: 'SET_FOCUS_MODE', on: !state.focusMode });
          return;
        }
      }
      if (e.key === 'Escape' && state.focusMode && !anyModalOpen) {
        dispatch({ type: 'SET_FOCUS_MODE', on: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.paletteOpen, state.focusMode, state.view, inApp, anyModalOpen]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-ink text-text">
      {focusActive ? (
        <ScriptEditor key={state.project.id} minimal />
      ) : shootImmersive ? (
        <ClapperboardView />
      ) : inApp ? (
        <>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="relative min-h-0 flex-1 overflow-hidden">
              {state.view === 'write-overview' && <WriteOverview />}
              {state.view === 'write' && <WriteView />}
              {state.view === 'plan-overview' && <PlanOverview />}
              {state.view === 'scene' && <SceneView />}
              {state.view === 'shots' && <ShotlistView />}
              {state.view === 'days' && <ShootDaysView />}
              {state.view === 'casting' && <CastingView />}
              {state.view === 'gear' && <GearView />}
              {state.view === 'pipeline' && <PipelineBoard />}
            </main>
            <StatusBar />
          </div>
        </>
      ) : (
        <div className="min-w-0 flex-1">
          <HomeView />
        </div>
      )}

      <NewProjectDialog />
      <SettingsDialog />
      <CommandPalette />
      <Toast />
      <GrainOverlay />

      <div className="fixed inset-0 z-40 hidden flex-col items-center justify-center gap-3 bg-ink p-8 text-center max-[799px]:flex">
        <span className="font-black text-[28px] tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <p className="micro text-muted">A+ är gjort för större skärmar (minst 800 px bred).</p>
      </div>
    </div>
  );
}
