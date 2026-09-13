import { useState } from 'react';
import { useApp } from '../state/AppState';
import { createProject, PROJECT_FORMATS, relativeTime } from '../state/projects';
import type { ProjectFormat } from '../types';
import { Icon } from '../components/ui/Icon';
import { FieldLabel, inputClass, MHeader, Segmented, Sheet } from './ui';

export function ProjectsTab({ onOpened }: { onOpened: () => void }) {
  const { state, dispatch } = useApp();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<ProjectFormat>('Kortfilm');

  const create = () => {
    dispatch({ type: 'CREATE_PROJECT', project: createProject({ title, subtitle: '', format, template: 'scene' }) });
    setCreating(false);
    setTitle('');
    onOpened();
  };

  const toDesktop = () => {
    try {
      localStorage.setItem('aplus.forceDesktop', '1');
    } catch {
      /* privat läge — länken fungerar ändå för den här sessionen */
    }
    window.location.href = '/';
  };

  return (
    <div className="flex h-full flex-col">
      <MHeader title="Projekt" sub={`${state.projects.length} sparade på den här enheten`} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-accent text-[16px] font-bold text-accentInk active:scale-[0.98]"
        >
          <Icon name="plus" size={16} />
          Nytt projekt
        </button>

        <ul className="mt-4 flex flex-col gap-2">
          {state.projects.map((p) => {
            const active = state.hasProject && state.project.id === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'SELECT_PROJECT', id: p.id });
                    onOpened();
                  }}
                  className={`flex w-full items-center gap-3 rounded-[16px] border bg-surface p-4 text-left active:bg-raised ${active ? 'border-accent/60' : 'border-line'}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[17px] font-bold">{p.title}</div>
                    <div className="truncate text-[13px] text-muted">
                      {p.format} · ändrad {relativeTime(p.updatedAt)}
                    </div>
                  </div>
                  {active ? <span className="font-mono text-[12px] font-bold uppercase text-accent">Öppet</span> : <Icon name="chevronRight" size={16} className="text-muted" />}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-[13px] leading-relaxed text-muted">
          Projekten sparas bara i den här webbläsaren. Casting, utrustning och pipeline-tavlan finns i desktopversionen.
        </p>
        <button type="button" onClick={toDesktop} className="mx-auto mt-3 block h-11 rounded-full px-4 text-[14px] font-bold text-accent active:bg-raised">
          Öppna desktopversionen →
        </button>
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nytt projekt">
        <FieldLabel>Titel</FieldLabel>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Projektets namn" className={inputClass} autoFocus />
        <FieldLabel>Format</FieldLabel>
        <Segmented
          label="Format"
          value={format}
          onChange={setFormat}
          options={PROJECT_FORMATS.slice(0, 3).map((f) => ({ value: f, label: f }))}
        />
        <button type="button" onClick={create} className="mt-6 h-14 w-full rounded-[16px] bg-accent text-[16px] font-bold text-accentInk active:scale-[0.98]">
          Skapa projekt
        </button>
      </Sheet>
    </div>
  );
}
