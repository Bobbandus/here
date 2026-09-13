import { useCallback } from 'react';
import { useApp } from '../../state/AppState';
import type { AiKind, CreativeItem } from '../../types';
import { lensGear, shotFromMockItem } from '../plan/shots';

/**
 * INFOGA från platshållarpanelen. Lägger exempeldatan i lokal state
 * (shotlista eller regianteckningar). Inga anrop.
 */
export function useAiInsert(sceneId: string) {
  const { state, dispatch } = useApp();
  const notes = state.sceneMeta[sceneId]?.production.notes ?? '';

  return useCallback(
    (kind: AiKind, item: CreativeItem) => {
      if (!sceneId) return;
      if (kind === 'shotlist') {
        dispatch({ type: 'ADD_SHOT', sceneId, shot: shotFromMockItem(item, lensGear(state.gear)) });
        dispatch({ type: 'TOAST', message: `Tagning infogad i shotlistan för ${sceneId} (exempeldata)` });
        return;
      }
      const prefix = kind === 'synopsis' ? 'Synopsis: ' : 'Blockning: ';
      const line = `${prefix}${item.text}${kind === 'blocking' ? ` (${item.meta})` : ''}`;
      dispatch({ type: 'UPDATE_PRODUCTION', sceneId, patch: { notes: notes ? `${notes}\n${line}` : line } });
      dispatch({ type: 'TOAST', message: 'Infogat i regianteckningar (exempeldata)' });
    },
    [sceneId, notes, dispatch, state.gear],
  );
}
