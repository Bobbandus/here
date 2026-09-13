import type { PipelineStage, Status } from '../../types';
import { useApp } from '../../state/AppState';

export const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'write', label: 'Skriv' },
  { id: 'prepro', label: 'Pre-pro' },
  { id: 'production', label: 'Produktion' },
  { id: 'post', label: 'Post' },
];

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'Att göra',
  active: 'Pågår',
  done: 'Klar',
  blocked: 'Blockerad',
};

const chipClass: Record<Status, string> = {
  done: 'bg-accent border-accent text-accentInk',
  active: 'border-accent text-accent',
  todo: 'border-line text-muted hover:border-[#3a3a42]',
  blocked: 'border-flare text-flare',
};

interface StageChipProps {
  sceneId: string;
  stage: PipelineStage;
  status: Status;
  showStage?: boolean;
  className?: string;
}

/** Klickbart stadiumchip som cyklar todo → active → done → blocked. */
export function StageChip({ sceneId, stage, status, showStage = false, className = '' }: StageChipProps) {
  const { dispatch } = useApp();
  const stageLabel = STAGES.find((s) => s.id === stage)?.label ?? stage;
  return (
    <button
      type="button"
      aria-pressed={status === 'done'}
      aria-label={`${sceneId} ${stageLabel}: ${STATUS_LABEL[status]}. Klicka för att byta status.`}
      onClick={() => dispatch({ type: 'CYCLE_STATUS', sceneId, stage })}
      className={`inline-flex h-7 min-w-[92px] items-center justify-center gap-1 rounded-full border px-3 font-mono text-[0.64rem] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${chipClass[status]} ${className}`}
    >
      {showStage && <span className="opacity-70">{stageLabel} ·</span>}
      {STATUS_LABEL[status]}
    </button>
  );
}

const dotClass: Record<Status, string> = {
  done: 'bg-accent border-accent',
  active: 'bg-gold border-gold',
  blocked: 'bg-flare border-flare',
  todo: 'border-muted',
};

/** Fyra små prickar, en per stadium (●○○○). */
export function StageDots({ pipeline }: { pipeline: Record<PipelineStage, Status> }) {
  const text = STAGES.map((s) => `${s.label} ${STATUS_LABEL[pipeline[s.id]].toLowerCase()}`).join(', ');
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={text} title={text}>
      {STAGES.map((s) => (
        <span key={s.id} className={`h-[6px] w-[6px] rounded-full border ${dotClass[pipeline[s.id]]}`} />
      ))}
    </span>
  );
}

/** Scenens nuvarande stadium: första som inte är klart. */
export function currentStage(pipeline: Record<PipelineStage, Status>): PipelineStage {
  return STAGES.find((s) => pipeline[s.id] !== 'done')?.id ?? 'post';
}
