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
import { MobileApp } from './mobile/MobileApp';

const FORCE_DESKTOP_KEY = 'aplus.forceDesktop';

/**
 * /mobile är mobilappen. Telefoner som öppnar / skickas dit automatiskt (utan
 * omladdning) — utom om man uttryckligen valt desktopversionen därifrån.
 */
function resolveMobileRoute(): boolean {
  const { pathname, search } = window.location;
  const onMobile = pathname === '/mobile' || pathname.startsWith('/mobile/');
  let forceDesktop = false;
  try {
    if (new URLSearchParams(search).get('desktop') === '1') localStorage.setItem(FORCE_DESKTOP_KEY, '1');
    if (onMobile) localStorage.removeItem(FORCE_DESKTOP_KEY);
    forceDesktop = localStorage.getItem(FORCE_DESKTOP_KEY) === '1';
  } catch {
    /* privat läge */
  }
  if (onMobile) return true;
  if (pathname === '/' && !forceDesktop && window.matchMedia('(max-width: 760px) and (pointer: coarse)').matches) {
    window.history.replaceState(null, '', '/mobile');
    return true;
  }
  return false;
}

const onMobileRoute = resolveMobileRoute();

export default function App() {
  const { state, dispatch } = useApp();
  if (onMobileRoute) return <MobileApp />;
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
    </div>
  );
}
