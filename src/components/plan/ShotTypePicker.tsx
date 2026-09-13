import { useState } from 'react';
import type { ShotType } from '../../types';
import { Popover } from '../ui/Popover';
import { ShotFrameIcon } from './ShotFrameIcon';
import { SHOT_TYPE_LABEL, SHOT_TYPES } from './shots';

interface ShotTypePickerProps {
  value: ShotType;
  onChange: (type: ShotType) => void;
  label: string;
}

/** Knapp som visar tagningens bildutsnitt som en liten ramskiss — öppnar en meny med alla typer. */
export function ShotTypePicker({ value, onChange, label }: ShotTypePickerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={SHOT_TYPE_LABEL[value]}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className="field flex h-9 w-full items-center gap-2 px-2 font-mono text-[11.5px]"
      >
        <ShotFrameIcon type={value} size={22} className="shrink-0 text-muted" />
        <span className="truncate">{value}</span>
      </button>
      {anchor && (
        <Popover anchorEl={anchor} onClose={() => setAnchor(null)} label="Välj bildutsnitt" width={320}>
          <div className="grid grid-cols-3 gap-1.5">
            {SHOT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={t === value}
                onClick={() => {
                  onChange(t);
                  setAnchor(null);
                }}
                className={`flex flex-col items-center gap-1.5 rounded-btn border p-2 transition-colors duration-150 ${
                  t === value ? 'border-accent/60 bg-raised text-accent' : 'border-transparent text-muted hover:bg-raised hover:text-text'
                }`}
              >
                <ShotFrameIcon type={t} size={30} />
                <span className="font-mono text-[0.62rem] font-bold">{t}</span>
                <span className="text-center text-[0.62rem] leading-tight">{SHOT_TYPE_LABEL[t]}</span>
              </button>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
