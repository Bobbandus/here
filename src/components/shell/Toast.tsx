import { useEffect } from 'react';
import { useApp } from '../../state/AppState';

export function Toast() {
  const { state, dispatch } = useApp();
  const toast = state.toast;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST', id: toast.id }), 2200);
    return () => window.clearTimeout(t);
  }, [toast, dispatch]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-12 z-40 flex justify-center">
      {toast && (
        <div key={toast.id} className="glass flex items-center gap-2 rounded-[6px] px-4 py-2 font-mono text-[0.74rem] tracking-[0.04em] text-text">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
