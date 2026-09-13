import { useApp } from '../../state/AppState';
import type { AiKind } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface AiActionButtonProps {
  kind: AiKind;
  label: string;
}

/**
 * Platshållarknapp för framtida AI-funktion. Öppnar enbart AiPlaceholderPanel
 * med statisk exempeldata — inga anrop görs.
 */
export function AiActionButton({ kind, label }: AiActionButtonProps) {
  const { state, dispatch } = useApp();
  const open = state.ai === kind;
  return (
    <Button
      variant="quiet"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="ai-panel"
      onClick={() => dispatch(open ? { type: 'CLOSE_AI' } : { type: 'OPEN_AI', kind })}
      className={open ? 'bg-raised text-text' : ''}
    >
      <Icon name="ai" size={12} />
      {label}
    </Button>
  );
}
