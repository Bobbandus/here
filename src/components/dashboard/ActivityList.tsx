import { useApp } from '../../state/AppState';
import { relativeTime } from '../../state/projects';
import { Chip, type ChipTone } from '../ui/Chip';
import { Panel } from '../ui/Panel';
import { currentStage, STAGES } from '../pipeline/StageChip';
import type { PipelineStage } from '../../types';

const stageTone: Record<PipelineStage, ChipTone> = {
  write: 'accentOutline',
  prepro: 'goldOutline',
  production: 'flare',
  post: 'muted',
};

export function ActivityList() {
  const { state, derived, goToScene } = useApp();
  const rows = state.project.recent.map((r) => ({ r, s: derived.sceneById[r.sceneId] })).filter((x) => x.s);

  return (
    <Panel title="Senast redigerat" eyebrow bodyClassName="py-1.5">
      {rows.length === 0 ? (
        <p className="px-5 py-5 font-mono text-[0.72rem] text-muted">INGA ÄNDRINGAR ÄNNU</p>
      ) : (
        <ul>
          {rows.slice(0, 6).map(({ r, s }) => {
            if (!s) return null;
            const stage = currentStage(s.pipeline);
            return (
              <li key={r.sceneId}>
                <button
                  type="button"
                  onClick={() => goToScene(s.scene_id, 'write')}
                  className="grid h-14 w-full grid-cols-[64px_1fr_auto_110px] items-center gap-4 px-5 text-left transition-colors duration-150 hover:bg-raised"
                >
                  <span className="font-mono text-[0.74rem] text-accent">{s.scene_id}</span>
                  <span className="truncate text-[13.5px]">{s.scene_heading}</span>
                  <span className="font-mono text-[0.66rem] text-muted">{relativeTime(r.at)}</span>
                  <span className="flex justify-end">
                    <Chip tone={stageTone[stage]}>{STAGES.find((x) => x.id === stage)?.label}</Chip>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
