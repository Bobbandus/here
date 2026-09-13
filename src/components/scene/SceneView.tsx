import { useApp } from '../../state/AppState';
import { formatEighths } from '../../fountain/parse';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MonoLabel } from '../ui/MonoLabel';
import { HighlightLayer } from '../editor/HighlightLayer';
import { EmptyScenes } from '../plan/EmptyScenes';
import { AiPlaceholderPanel } from './AiPlaceholderPanel';
import { SceneMetaPanel } from './SceneMetaPanel';
import { useAiInsert } from './useAiInsert';

export function SceneView() {
  const { state, derived, dispatch, goToScene } = useApp();
  const scenes = derived.scenes;
  const index = Math.max(0, scenes.findIndex((s) => s.scene_id === state.selectedSceneId));
  const scene = scenes[index];
  const onInsert = useAiInsert(scene?.scene_id ?? '');
  if (!scene) return <EmptyScenes />;

  const lines =
    scene.hasText && scene.headingLine !== null && scene.endLine !== null
      ? derived.lines.slice(scene.headingLine, scene.endLine + 1)
      : [];

  const select = (i: number) => {
    const s = scenes[(i + scenes.length) % scenes.length];
    dispatch({ type: 'SELECT_SCENE', sceneId: s.scene_id });
  };

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex h-auto min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:h-16 sm:gap-4 sm:px-6 sm:py-0">
        <MonoLabel eyebrow>Scen</MonoLabel>
        <Button variant="quiet" aria-label="Föregående scen" onClick={() => select(index - 1)}>
          <Icon name="chevronLeft" size={14} />
        </Button>
        <select
          className="field w-full min-w-0 flex-1 font-mono text-[12.5px] sm:w-[380px] sm:flex-none"
          aria-label="Välj scen"
          value={scene.scene_id}
          onChange={(e) => dispatch({ type: 'SELECT_SCENE', sceneId: e.target.value })}
        >
          {scenes.map((s) => (
            <option key={s.scene_id} value={s.scene_id}>
              {s.scene_id} · {s.scene_heading}
            </option>
          ))}
        </select>
        <Button variant="quiet" aria-label="Nästa scen" onClick={() => select(index + 1)}>
          <Icon name="chevronRight" size={14} />
        </Button>
        <span className="font-mono text-[0.68rem] text-muted">
          {index + 1}/{scenes.length} · {formatEighths(scene.page_length)} S
        </span>
        <span className="flex gap-3 sm:ml-auto">
          <Button variant="ghost" onClick={() => goToScene(scene.scene_id, 'shots')}>
            Shotlista →
          </Button>
          {scene.hasText && (
            <Button variant="ghost" onClick={() => goToScene(scene.scene_id, 'write')}>
              Öppna i A+ Write →
            </Button>
          )}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[55fr_45fr] md:overflow-hidden">
        <div className="min-h-0 overflow-y-auto border-b border-line bg-ink p-4 md:border-b-0 md:border-r md:p-8">
          <div className="mx-auto max-w-[780px] bg-paper px-5 py-8 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] sm:px-10 md:px-16 md:py-14">
            {lines.length > 0 ? (
              <HighlightLayer lines={lines} sceneNumbers={{ [lines[0].index]: String(index + 1) }} />
            ) : (
              <div className="sp-page">
                <div className="sp-line sp-scene_heading">
                  <span className="sp-scene-no">{index + 1}</span>
                  {scene.scene_heading}
                </div>
                <p className="mt-6 font-mono text-[12px] leading-relaxed text-[#6f6f66]">
                  [[ Scenen har ingen manustext i utkastet — endast metadata. ]]
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto p-6">
          <SceneMetaPanel scene={scene} />
        </div>
      </div>

      <AiPlaceholderPanel sceneId={scene.scene_id} onInsert={onInsert} />
    </div>
  );
}
