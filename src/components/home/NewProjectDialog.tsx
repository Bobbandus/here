import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useApp } from '../../state/AppState';
import { createProject, PROJECT_FORMATS, type ProjectTemplate } from '../../state/projects';
import type { ProjectFormat } from '../../types';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';

export function NewProjectDialog() {
  const { state } = useApp();
  if (!state.newProjectOpen) return null;
  return <Dialog />;
}

function Dialog() {
  const { dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [format, setFormat] = useState<ProjectFormat>('Kortfilm');
  const [template, setTemplate] = useState<ProjectTemplate>('scene');
  const titleRef = useRef<HTMLInputElement>(null);
  const close = () => dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: false });

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'SET_NEW_PROJECT_OPEN', open: false });
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus({ preventScroll: true });
    };
  }, [dispatch]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    const project = createProject({ title, subtitle, format, template });
    dispatch({ type: 'CREATE_PROJECT', project });
    dispatch({ type: 'TOAST', message: `Projektet ${project.title} skapat` });
  };

  const templates: { id: ProjectTemplate; label: string; detail: string }[] = [
    { id: 'scene', label: 'Mall med en scen', detail: 'Akt, scenrubrik och en action-rad att skriva vidare på' },
    { id: 'empty', label: 'Tomt manus', detail: 'Börja från en tom sida' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/55 pt-[12vh]" onMouseDown={close}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="glass-strong w-[520px] max-w-[calc(100vw-32px)] rounded-panel"
      >
        <header className="flex h-14 items-center justify-between border-b border-white/10 pl-6 pr-3">
          <MonoLabel as="h2" id="new-project-title" eyebrow>
            Nytt projekt
          </MonoLabel>
          <button
            type="button"
            aria-label="Stäng"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors duration-150 hover:bg-raised hover:text-text"
          >
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <Field label="Titel">
            {(id) => (
              <input
                id={id}
                ref={titleRef}
                className="field h-11 font-display text-[16px] font-bold uppercase"
                placeholder="T.EX. NÅN VÄCKTE TIGERN"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            )}
          </Field>
          <div className="grid grid-cols-[1fr_170px] gap-3">
            <Field label="Undertitel / logline">
              {(id) => (
                <input
                  id={id}
                  className="field"
                  placeholder="Valfritt"
                  value={subtitle}
                  maxLength={80}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              )}
            </Field>
            <Field label="Format">
              {(id) => (
                <select id={id} className="field" value={format} onChange={(e) => setFormat(e.target.value as ProjectFormat)}>
                  {PROJECT_FORMATS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="micro mb-2 text-muted">Start</legend>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer flex-col gap-1.5 rounded-media border p-4 transition-colors duration-150 ${
                    template === t.id ? 'border-accent bg-accent/[0.06]' : 'border-line hover:border-[#3a3a42]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="template"
                      value={t.id}
                      checked={template === t.id}
                      onChange={() => setTemplate(t.id)}
                      className="accent-accent"
                    />
                    <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]">{t.label}</span>
                  </span>
                  <span className="text-[12px] leading-snug text-muted">{t.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted">Sparas lokalt</span>
          <span className="flex gap-3">
            <Button variant="ghost" size="md" onClick={close}>
              Avbryt
            </Button>
            <Button variant="primary" size="md" type="submit" disabled={!title.trim()}>
              Skapa projekt →
            </Button>
          </span>
        </footer>
      </form>
    </div>
  );
}
